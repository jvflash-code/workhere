import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

type Props = {
  visible: boolean;
  onClose: () => void;
};

type Screen = 'main' | 'email' | 'signup';

export default function SignInSheet({ visible, onClose }: Props) {
  const { t } = useLanguage();
  const [view, setView] = useState<Screen>('main');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleEmailSignUp() {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      Alert.alert('Account created!', 'Check your email to confirm your account, then sign in.', [
        { text: 'OK', onPress: () => setView('email') },
      ]);
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
              <Text style={styles.title}>{t('sheetTitle')}</Text>
              <Text style={styles.sub}>{t('sheetSub')}</Text>

              <TouchableOpacity style={styles.appleBtn} onPress={() => setView('email')}>
                <Text style={styles.appleBtnText}>{t('continueEmail')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dismissBtn} onPress={resetAndClose}>
                <Text style={styles.dismissText}>{t('maybeLater')}</Text>
              </TouchableOpacity>
            </>
          ) : view === 'email' ? (
            <>
              <TouchableOpacity style={styles.backBtn} onPress={() => { setView('main'); setError(null); }}>
                <Text style={styles.backText}>{t('back')}</Text>
              </TouchableOpacity>

              <Text style={styles.title}>{t('signInEmailTitle')}</Text>
              <Text style={styles.sub}>{t('signInEmailSub')}</Text>

              <TextInput
                style={styles.input}
                placeholder={t('email')}
                placeholderTextColor="#9A9285"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                style={styles.input}
                placeholder={t('password')}
                placeholderTextColor="#9A9285"
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
                  : <Text style={styles.appleBtnText}>{t('signIn')}</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.toggleBtn} onPress={() => { setView('signup'); setError(null); }}>
                <Text style={styles.toggleText}>{t('noAccountCreate')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dismissBtn} onPress={resetAndClose}>
                <Text style={styles.dismissText}>{t('cancel')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.backBtn} onPress={() => { setView('email'); setError(null); }}>
                <Text style={styles.backText}>{t('back')}</Text>
              </TouchableOpacity>

              <Text style={styles.title}>{t('createAccount')}</Text>
              <Text style={styles.sub}>{t('createAccountSub')}</Text>

              <TextInput
                style={styles.input}
                placeholder={t('email')}
                placeholderTextColor="#9A9285"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                style={styles.input}
                placeholder={t('passwordMin')}
                placeholderTextColor="#9A9285"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={[styles.appleBtn, loading && styles.btnDisabled]}
                onPress={handleEmailSignUp}
                disabled={loading}>
                {loading
                  ? <ActivityIndicator color="white" />
                  : <Text style={styles.appleBtnText}>{t('createAccount')}</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.dismissBtn} onPress={resetAndClose}>
                <Text style={styles.dismissText}>{t('cancel')}</Text>
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
  handle: { width: 36, height: 4, backgroundColor: '#E5DECF', borderRadius: 2, marginBottom: 24 },
  logo: { fontSize: 26, fontWeight: '700', color: '#26221C', marginBottom: 8 },
  logoAccent: { color: '#D85A30' },
  title: { fontSize: 20, fontWeight: '700', color: '#26221C', textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 14, color: '#6E675C', textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  appleBtn: { backgroundColor: '#000', borderRadius: 14, padding: 16, width: '100%', alignItems: 'center', marginBottom: 12 },
  appleBtnText: { color: 'white', fontSize: 15, fontWeight: '600' },
  dismissBtn: {},
  dismissText: { color: '#8A8275', fontSize: 13 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 16 },
  backText: { color: '#B5471F', fontSize: 14, fontWeight: '600' },
  input: { width: '100%', backgroundColor: '#FAF6EF', borderRadius: 12, padding: 14, fontSize: 14, color: '#26221C', marginBottom: 12 },
  errorText: { color: '#ff3b30', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  btnDisabled: { backgroundColor: '#857D70' },
  toggleBtn: { marginTop: 12, marginBottom: 8 },
  toggleText: { color: '#B5471F', fontSize: 13 },
});
