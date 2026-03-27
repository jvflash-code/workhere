import { useRef, useState } from 'react';
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
import { detectLanguage, translateText } from '../../utils/translate';

type Message = {
  id: number;
  from: 'me' | 'them';
  name?: string;
  text: string;
  translated: string | null;
  translating?: boolean;
};

const initialMessages: Message[] = [
  {
    id: 1,
    from: 'them',
    name: 'Maria',
    text: 'Hi! Happy to answer any questions about working here!',
    translated: null,
  },
];

export default function ChatScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const nextId = useRef(2);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;

    setInput('');
    setSending(true);

    const id = nextId.current++;
    const from = detectLanguage(text);
    const to = from === 'en' ? 'es' : 'en';

    // Add message immediately, mark as translating
    const newMsg: Message = { id, from: 'me', text, translated: null, translating: true };
    setMessages((prev) => [...prev, newMsg]);

    // Scroll to bottom
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const result = await translateText(text, from, to);
      const label = to === 'es' ? '🇲🇽 Traducido' : '🇺🇸 Translated';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, translated: `${label}: ${result}`, translating: false } : m
        )
      );
    } catch {
      // Translation failed silently — message still shows, just no translation tag
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, translating: false } : m))
      );
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
