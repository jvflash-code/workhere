import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

type Props = {
  visible: boolean;
  onClose: () => void;
};

type Screen = 'main' | 'email';

export default function SignInSheet({ visible, onClose }: Props) {
  const [view, setView] = useState<Screen>('main');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleApple() {
    Alert.alert('Coming Soon', 'Apple Sign-In will be available when the app is published to the App Store.');
  }

  function handleGoogle() {
    Alert.alert('Coming Soon', 'Google Sign-In will be available in the next update.');
  }

  async function handleEmailSignIn() {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      resetAndClose();
    }
  }

  function resetAndClose() {
    setView('main');
    setEmail('');
    setPassword('');
    setError(null);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {view === 'main' ? (
            <>
              <Text style={styles.logo}>WhyWork<Text style={styles.logoAccent}>Here</Text></Text>
              <Text style={styles.title}>Chat with real employees</Text>
              <Text style={styles.sub}>Sign in to ask questions and get honest answers about working here.</Text>

              <TouchableOpacity style={styles.appleBtn} onPress={handleApple}>
                <Text style={styles.appleBtnText}>🍎  Continue with Apple</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.googleBtn} onPress={handleGoogle}>
                <Text style={styles.googleBtnText}>🔵  Continue with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.emailBtn} onPress={() => setView('email')}>
                <Text style={styles.emailBtnText}>Continue with Email</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dismissBtn} onPress={resetAndClose}>
                <Text style={styles.dismissText}>Maybe later</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.backBtn} onPress={() => { setView('main'); setError(null); }}>
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>

              <Text style={styles.title}>Sign in with Email</Text>
              <Text style={styles.sub}>Enter your email and password to continue.</Text>

              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#aaa"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#aaa"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={[styles.appleBtn, loading && styles.btnDisabled]}
                onPress={handleEmailSignIn}
                disabled={loading}>
                {loading
                  ? <ActivityIndicator color="white" />
                  : <Text style={styles.appleBtnText}>Sign In</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.dismissBtn} onPress={resetAndClose}>
                <Text style={styles.dismissText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 52, alignItems: 'center' },
  handle: { width: 36, height: 4, backgroundColor: '#ddd', borderRadius: 2, marginBottom: 24 },
  logo: { fontSize: 26, fontWeight: '700', color: '#333', marginBottom: 8 },
  logoAccent: { color: '#1A5CFF' },
  title: { fontSize: 20, fontWeight: '700', color: '#333', textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  appleBtn: { backgroundColor: '#000', borderRadius: 14, padding: 16, width: '100%', alignItems: 'center', marginBottom: 12 },
  appleBtnText: { color: 'white', fontSize: 15, fontWeight: '600' },
  googleBtn: { backgroundColor: 'white', borderRadius: 14, padding: 16, width: '100%', alignItems: 'center', borderWidth: 1.5, borderColor: '#ddd', marginBottom: 20 },
  googleBtnText: { color: '#333', fontSize: 15, fontWeight: '600' },
  emailBtn: { marginBottom: 16 },
  emailBtnText: { color: '#1A5CFF', fontSize: 14, fontWeight: '600' },
  dismissBtn: {},
  dismissText: { color: '#aaa', fontSize: 13 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 16 },
  backText: { color: '#1A5CFF', fontSize: 14, fontWeight: '600' },
  input: { width: '100%', backgroundColor: '#f5f5f5', borderRadius: 12, padding: 14, fontSize: 14, color: '#333', marginBottom: 12 },
  errorText: { color: '#ff3b30', fontSize: 12, marginBottom: 12, textAlign: 'center' },
  btnDisabled: { backgroundColor: '#999' },
});
