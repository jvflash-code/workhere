import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import SignInSheet from '../../components/SignInSheet';
import { useActiveCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

type ConversationSummary = {
  id: string;
  company_id: string;
  company_name: string;
  created_at: string;
};

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const { setCompanyById } = useActiveCompany();
  const [showSignIn, setShowSignIn] = useState(false);

  const [fullName, setFullName] = useState('');
  const [savedName, setSavedName] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [convLoading, setConvLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadProfile();
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function loadProfile() {
    setProfileLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user!.id)
      .maybeSingle();
    const name = data?.full_name ?? '';
    setFullName(name);
    setSavedName(name);
    setProfileLoading(false);
  }

  async function loadConversations() {
    setConvLoading(true);
    const { data } = await supabase
      .from('conversations')
      .select('id, company_id, created_at, companies(name)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    const rows: ConversationSummary[] = (data ?? []).map((c: any) => ({
      id: c.id,
      company_id: c.company_id,
      company_name: c.companies?.name ?? 'Unknown company',
      created_at: c.created_at,
    }));

    // A user may have several conversations with one company — show each company once
    const seen = new Set<string>();
    setConversations(
      rows.filter((r) => {
        if (seen.has(r.company_id)) return false;
        seen.add(r.company_id);
        return true;
      })
    );
    setConvLoading(false);
  }

  async function saveName() {
    if (savingName) return;
    setSavingName(true);
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user!.id, full_name: fullName.trim() });
    setSavingName(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setSavedName(fullName.trim());
      Alert.alert('Saved', 'Your name has been updated.');
    }
  }

  function openConversation(conv: ConversationSummary) {
    setCompanyById(conv.company_id);
    router.push('/(tabs)/chat');
  }

  function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  function initials(email: string) {
    return email.slice(0, 2).toUpperCase();
  }

  // Signed-out state
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.headerPlain}>
          <Text style={styles.title}>Account</Text>
          <Text style={styles.sub}>Sign in to manage your profile</Text>
        </View>
        <View style={styles.signedOut}>
          <Ionicons name="person-circle-outline" size={64} color="#ccc" />
          <Text style={styles.signedOutText}>
            Sign in to see your conversations and save your details.
          </Text>
          <TouchableOpacity style={styles.signInBtn} onPress={() => setShowSignIn(true)}>
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
        <SignInSheet visible={showSignIn} onClose={() => setShowSignIn(false)} />
      </View>
    );
  }

  const nameChanged = fullName.trim() !== savedName.trim();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(user.email ?? '?')}</Text>
        </View>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      {/* Display name */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Display name</Text>
        <TextInput
          style={styles.input}
          placeholder="Add your name"
          placeholderTextColor="#aaa"
          value={fullName}
          onChangeText={setFullName}
          editable={!profileLoading}
        />
        {nameChanged && (
          <TouchableOpacity
            style={[styles.saveBtn, savingName && styles.saveBtnDisabled]}
            onPress={saveName}
            disabled={savingName}>
            {savingName ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Conversations */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Your conversations</Text>
        {convLoading ? (
          <ActivityIndicator color="#1A5CFF" size="small" style={{ marginVertical: 16 }} />
        ) : conversations.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              You haven&apos;t started any conversations yet. Explore a company and ask an
              employee a question.
            </Text>
          </View>
        ) : (
          conversations.map((conv) => (
            <TouchableOpacity key={conv.id} style={styles.convRow} onPress={() => openConversation(conv)}>
              <View style={styles.convLogo}>
                <Text style={styles.convLogoText}>{conv.company_name.charAt(0)}</Text>
              </View>
              <View style={styles.convInfo}>
                <Text style={styles.convName}>{conv.company_name}</Text>
                <Text style={styles.convSub}>Tap to continue chatting</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutBtnText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#1A5CFF', padding: 24, paddingTop: 60, alignItems: 'center' },
  headerPlain: { backgroundColor: '#1A5CFF', padding: 24, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '700', color: 'white' },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#1A5CFF' },
  email: { fontSize: 15, fontWeight: '600', color: 'white' },
  section: { padding: 16, paddingBottom: 0 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 10 },
  input: { backgroundColor: 'white', borderRadius: 12, padding: 14, fontSize: 14, color: '#333', borderWidth: 1, borderColor: '#eee' },
  saveBtn: { backgroundColor: '#1A5CFF', borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 10 },
  saveBtnDisabled: { backgroundColor: '#7BA7FF' },
  saveBtnText: { color: 'white', fontSize: 14, fontWeight: '600' },
  emptyCard: { backgroundColor: 'white', borderRadius: 12, padding: 20 },
  emptyText: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20 },
  convRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 8, gap: 12 },
  convLogo: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#1A5CFF', alignItems: 'center', justifyContent: 'center' },
  convLogoText: { fontSize: 20, fontWeight: '700', color: 'white' },
  convInfo: { flex: 1 },
  convName: { fontSize: 15, fontWeight: '600', color: '#333' },
  convSub: { fontSize: 12, color: '#888', marginTop: 2 },
  arrow: { fontSize: 18, color: '#ccc' },
  signOutBtn: { margin: 16, marginTop: 24, padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#eee', backgroundColor: 'white' },
  signOutBtnText: { color: '#E8472A', fontSize: 15, fontWeight: '600' },
  signedOut: { alignItems: 'center', padding: 32, gap: 12 },
  signedOutText: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
  signInBtn: { backgroundColor: '#1A5CFF', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14, marginTop: 8 },
  signInBtnText: { color: 'white', fontSize: 15, fontWeight: '600' },
});
