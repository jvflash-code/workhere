import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LangToggle from '../../components/LangToggle';
import SignInSheet from '../../components/SignInSheet';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { supabase } from '../../lib/supabase';
import { detectLanguage, translateText } from '../../utils/translate';

type Message = {
  id: number;
  from: 'me' | 'them';
  name?: string;
  text: string;
  translated: string | null;
  translating?: boolean;
};

type Employee = {
  id: string;
  name: string;
  role: string;
  years_at_company: string;
};

// Fixed company ID for the sample company
const COMPANY_ID = '00000000-0000-0000-0000-000000000001';

let localIdCounter = 1;
function nextLocalId() {
  return localIdCounter++;
}

export default function ChatScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [waitingForReply, setWaitingForReply] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Register for push notifications
  usePushNotifications(user?.id);

  // On mount (when user is logged in), set up conversation
  useEffect(() => {
    if (!user) return;

    async function initConversation() {
      setLoading(true);
      try {
        // Fetch first live employee for the company
        const { data: emp } = await supabase
          .from('employees')
          .select('id, name, role, years_at_company')
          .eq('company_id', COMPANY_ID)
          .limit(1)
          .single();

        if (emp) {
          setEmployee(emp as Employee);
        }

        // Look for an existing active conversation for this user+company
        const { data: existing } = await supabase
          .from('conversations')
          .select('id')
          .eq('company_id', COMPANY_ID)
          .eq('user_id', user!.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        let convId: string;

        if (existing) {
          convId = existing.id;
        } else {
          // Create a new conversation
          const { data: newConv, error } = await supabase
            .from('conversations')
            .insert({
              company_id: COMPANY_ID,
              user_id: user!.id,
              employee_id: emp?.id ?? null,
              status: 'active',
            })
            .select('id')
            .single();

          if (error || !newConv) throw error;
          convId = newConv.id;
        }

        setConversationId(convId);

        // Load existing messages
        const { data: dbMessages } = await supabase
          .from('messages')
          .select('id, role, content, created_at')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: true })
          .limit(50);

        if (dbMessages && dbMessages.length > 0) {
          const mapped: Message[] = dbMessages.map((m) => ({
            id: nextLocalId(),
            from: m.role === 'user' ? 'me' : 'them',
            name: m.role !== 'user' ? (emp?.name ?? 'Employee') : undefined,
            text: m.content,
            translated: null,
          }));
          setMessages(mapped);
        } else {
          // Show greeting from employee
          const greeting: Message = {
            id: nextLocalId(),
            from: 'them',
            name: emp?.name ?? 'Employee',
            text: `Hi! I'm ${emp?.name ?? 'here'} and I'm happy to answer any questions about working here!`,
            translated: null,
          };
          setMessages([greeting]);
        }
      } catch {
        // If init fails gracefully, show a default greeting
        const greeting: Message = {
          id: nextLocalId(),
          from: 'them',
          name: 'Employee',
          text: 'Hi! Happy to answer any questions about working here!',
          translated: null,
        };
        setMessages([greeting]);
      } finally {
        setLoading(false);
      }
    }

    initConversation();
  }, [user]);

  // Subscribe to realtime messages when conversationId is available
  useEffect(() => {
    if (!conversationId || !employee) return;

    const employeeName = employee.name;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as { id: string; role: string; content: string };
          if (msg.role !== 'user') {
            setMessages((prev) => [
              ...prev,
              {
                id: nextLocalId(),
                from: 'them',
                name: employeeName,
                text: msg.content,
                translated: null,
              },
            ]);
            setWaitingForReply(false);
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, employee]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending || !conversationId) return;

    setInput('');
    setSending(true);

    const id = nextLocalId();
    const from = detectLanguage(text);
    const to = from === 'en' ? 'es' : 'en';

    // Add user message immediately, mark as translating
    const newMsg: Message = { id, from: 'me', text, translated: null, translating: true };
    setMessages((prev) => [...prev, newMsg]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    // Start translation in parallel
    translateText(text, from, to)
      .then((result) => {
        const label = to === 'es' ? '🇲🇽 Traducido' : '🇺🇸 Translated';
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, translated: `${label}: ${result}`, translating: false } : m
          )
        );
      })
      .catch(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, translating: false } : m))
        );
      });

    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

      // Save user message to Supabase
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: text,
      });

      // Show waiting indicator
      setWaitingForReply(true);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

      // Notify employee via push
      if (employee?.id) {
        await fetch(`${supabaseUrl}/functions/v1/push`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            employee_id: employee.id,
            title: 'New message',
            body: text.slice(0, 100),
            conversation_id: conversationId,
          }),
        });
      }
    } catch {
      setWaitingForReply(false);
      // Silently fail — user message is still visible
    } finally {
      setSending(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  if (!user) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>{t('chatWith')}</Text>
              <Text style={styles.sub}>{t('chatSub')}</Text>
            </View>
            <LangToggle />
          </View>
        </View>

        {/* Language bar */}
        <View style={styles.langBar}>
          <View style={styles.langPill}><Text style={styles.langText}>EN</Text></View>
          <Text style={styles.langArrow}>⇄</Text>
          <View style={styles.langPill}><Text style={styles.langText}>ES</Text></View>
          <Text style={styles.langNote}>{t('autoTranslate')}</Text>
        </View>

        {/* Locked guest view */}
        <View style={styles.guestArea}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.guestTitle}>Sign in to chat with employees</Text>
          <Text style={styles.guestSub}>Get honest answers about what it's really like to work here.</Text>
          <TouchableOpacity style={styles.signInBtn} onPress={() => setShowSignIn(true)}>
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <SignInSheet visible={showSignIn} onClose={() => setShowSignIn(false)} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>{t('chatWith')}{employee ? ` ${employee.name}` : ''}</Text>
            <Text style={styles.sub}>{t('chatSub')}</Text>
          </View>
          <LangToggle />
        </View>
      </View>

      {/* Language bar */}
      <View style={styles.langBar}>
        <View style={styles.langPill}><Text style={styles.langText}>EN</Text></View>
        <Text style={styles.langArrow}>⇄</Text>
        <View style={styles.langPill}><Text style={styles.langText}>ES</Text></View>
        <Text style={styles.langNote}>{t('autoTranslate')}</Text>
      </View>

      {/* Loading state */}
      {loading ? (
        <View style={styles.loadingArea}>
          <ActivityIndicator size="large" color="#1A5CFF" />
        </View>
      ) : (
        <>
          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.chatArea}
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
            {messages.map((msg) => (
              <View key={msg.id} style={msg.from === 'me' ? styles.meWrapper : styles.themWrapper}>
                {msg.from === 'them' && (
                  <Text style={styles.senderName}>{msg.name}</Text>
                )}
                <View style={[styles.bubble, msg.from === 'me' ? styles.meBubble : styles.themBubble]}>
                  <Text style={[styles.bubbleText, msg.from === 'me' ? styles.meText : styles.themText]}>
                    {msg.text}
                  </Text>
                </View>

                {/* Translation or loading indicator */}
                {msg.translating ? (
                  <View style={styles.translatingRow}>
                    <ActivityIndicator size="small" color="#1D9E75" />
                    <Text style={styles.translatingText}>Translating...</Text>
                  </View>
                ) : msg.translated ? (
                  <View style={styles.translatedTag}>
                    <Text style={styles.translatedText}>{msg.translated}</Text>
                  </View>
                ) : null}
              </View>
            ))}

            {/* Waiting for reply indicator */}
            {waitingForReply && (
              <View style={styles.themWrapper}>
                <Text style={styles.senderName}>{employee?.name ?? 'Employee'}</Text>
                <View style={[styles.bubble, styles.themBubble, styles.waitingBubble]}>
                  <ActivityIndicator size="small" color="#999" style={{ marginRight: 6 }} />
                  <Text style={[styles.bubbleText, styles.themText, styles.waitingText]}>
                    Message sent — waiting for reply
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={t('chatPlaceholder')}
              placeholderTextColor="#aaa"
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              editable={!sending}
            />
            <TouchableOpacity
              style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
              onPress={sendMessage}
              disabled={sending}>
              {sending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.sendIcon}>▶</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#1A5CFF', padding: 24, paddingTop: 60 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 20, fontWeight: '700', color: 'white' },
  sub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 3 },
  langBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 10, paddingHorizontal: 16, gap: 8, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  langPill: { backgroundColor: '#E8EFFE', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  langText: { color: '#1A5CFF', fontSize: 12, fontWeight: '600' },
  langArrow: { fontSize: 16, color: '#888' },
  langNote: { fontSize: 11, color: '#888', marginLeft: 4 },
  loadingArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chatArea: { flex: 1 },
  chatContent: { padding: 16, gap: 12 },
  themWrapper: { alignItems: 'flex-start', marginBottom: 8 },
  meWrapper: { alignItems: 'flex-end', marginBottom: 8 },
  senderName: { fontSize: 11, color: '#888', marginBottom: 3 },
  bubble: { maxWidth: '80%', padding: 10, borderRadius: 14 },
  themBubble: { backgroundColor: 'white', borderBottomLeftRadius: 4 },
  meBubble: { backgroundColor: '#1A5CFF', borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 13, lineHeight: 20 },
  themText: { color: '#333' },
  meText: { color: 'white' },
  waitingBubble: { flexDirection: 'row', alignItems: 'center' },
  waitingText: { color: '#999', fontStyle: 'italic', flex: 1 },
  translatingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  translatingText: { fontSize: 10, color: '#1D9E75' },
  translatedTag: { backgroundColor: '#E1F5EE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 4, maxWidth: '80%' },
  translatedText: { fontSize: 11, color: '#1D9E75', lineHeight: 16 },
  inputBar: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: 'white', borderTopWidth: 0.5, borderTopColor: '#eee' },
  input: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, fontSize: 13, color: '#333' },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A5CFF', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#7BA7FF' },
  sendIcon: { color: 'white', fontSize: 12, marginLeft: 2 },
  guestArea: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  lockIcon: { fontSize: 48, marginBottom: 16 },
  guestTitle: { fontSize: 18, fontWeight: '700', color: '#333', textAlign: 'center', marginBottom: 8 },
  guestSub: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  signInBtn: { backgroundColor: '#1A5CFF', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40 },
  signInBtnText: { color: 'white', fontSize: 15, fontWeight: '600' },
});
