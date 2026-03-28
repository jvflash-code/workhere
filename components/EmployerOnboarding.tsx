import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Called with the new company's ID after setup is complete */
  onComplete: (companyId: string) => void;
  /** Skip account creation if user is already signed in */
  startAtStep?: 2;
  /** User ID if already signed in (needed to skip step 1) */
  existingUserId?: string;
};

export default function EmployerOnboarding({
  visible,
  onClose,
  onComplete,
  startAtStep,
  existingUserId,
}: Props) {
  const [step, setStep] = useState<1 | 2>(startAtStep ?? 1);

  // Step 1 fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2 fields
  const [companyName, setCompanyName] = useState('');
  const [tagline, setTagline] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Holds the user ID between steps
  const [pendingUserId, setPendingUserId] = useState<string | null>(existingUserId ?? null);

  function reset() {
    setStep(startAtStep ?? 1);
    setFullName('');
    setEmail('');
    setPassword('');
    setCompanyName('');
    setTagline('');
    setEmployeeCount('');
    setError(null);
    setPendingUserId(existingUserId ?? null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleCreateAccount() {
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUpError) throw signUpError;

      const userId = data.user?.id;
      if (!userId) throw new Error('Account created but no user ID returned.');

      // Update profile created by DB trigger to employer role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'employer', full_name: fullName.trim() })
        .eq('id', userId);

      if (profileError) throw profileError;

      setPendingUserId(userId);
      setStep(2);
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCompany() {
    if (!companyName.trim()) {
      setError('Company name is required.');
      return;
    }
    if (!pendingUserId) {
      setError('Session lost — please close and try again.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Create the company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName.trim(),
          tagline: tagline.trim() || null,
          employee_count: employeeCount ? parseInt(employeeCount, 10) : 0,
        })
        .select('id')
        .single();

      if (companyError || !company) throw companyError ?? new Error('Failed to create company.');

      // Link profile to company
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ company_id: company.id })
        .eq('id', pendingUserId);

      if (profileError) throw profileError;

      // Create starter subscription
      await supabase.from('company_subscriptions').insert({
        company_id: company.id,
        plan_id: 'starter',
        billing_period: 'monthly',
      });

      reset();
      onComplete(company.id);
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.stepRow}>
              <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
              <View style={styles.stepLine} />
              <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
            </View>
            <Text style={styles.stepLabel}>Step {step} of 2</Text>
          </View>

          {step === 1 ? (
            <View style={styles.body}>
              <Text style={styles.logo}>
                Why<Text style={styles.logoAccent}>Work</Text>Here
              </Text>
              <Text style={styles.title}>Create your employer account</Text>
              <Text style={styles.sub}>
                Set up your company profile so job seekers can hear from your team.
              </Text>

              <Text style={styles.label}>Your name</Text>
              <TextInput
                style={styles.input}
                placeholder="Jane Smith"
                placeholderTextColor="#aaa"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                editable={!loading}
              />

              <Text style={styles.label}>Work email</Text>
              <TextInput
                style={styles.input}
                placeholder="jane@company.com"
                placeholderTextColor="#aaa"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Min 6 characters"
                placeholderTextColor="#aaa"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />

              {error && <Text style={styles.error}>{error}</Text>}

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={handleCreateAccount}
                disabled={loading}>
                {loading
                  ? <ActivityIndicator color="white" />
                  : <Text style={styles.primaryBtnText}>Continue →</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.body}>
              {!startAtStep && (
                <TouchableOpacity style={styles.backBtn} onPress={() => { setStep(1); setError(null); }}>
                  <Text style={styles.backBtnText}>← Back</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.title}>Set up your company</Text>
              <Text style={styles.sub}>
                This is what job seekers will see when they visit your profile.
              </Text>

              <Text style={styles.label}>Company name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Acme Inc."
                placeholderTextColor="#aaa"
                value={companyName}
                onChangeText={setCompanyName}
                editable={!loading}
              />

              <Text style={styles.label}>Tagline</Text>
              <TextInput
                style={styles.input}
                placeholder="Where bold ideas become real products"
                placeholderTextColor="#aaa"
                value={tagline}
                onChangeText={setTagline}
                editable={!loading}
              />

              <Text style={styles.label}>Number of employees</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 250"
                placeholderTextColor="#aaa"
                value={employeeCount}
                onChangeText={setEmployeeCount}
                keyboardType="number-pad"
                editable={!loading}
              />

              <View style={styles.planNote}>
                <Text style={styles.planNoteText}>
                  🎉 You'll start on the <Text style={styles.planNoteBold}>Starter plan</Text> — free forever, upgrade anytime.
                </Text>
              </View>

              {error && <Text style={styles.error}>{error}</Text>}

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={handleCreateCompany}
                disabled={loading}>
                {loading
                  ? <ActivityIndicator color="white" />
                  : <Text style={styles.primaryBtnText}>Launch my profile</Text>}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  scroll: { flexGrow: 1 },
  header: { backgroundColor: '#1A5CFF', paddingTop: 60, paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 60, right: 24 },
  closeBtnText: { color: 'rgba(255,255,255,0.8)', fontSize: 18, fontWeight: '600' },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.3)' },
  stepDotActive: { backgroundColor: 'white' },
  stepLine: { width: 40, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 6 },
  stepLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  body: { padding: 28 },
  logo: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 16 },
  logoAccent: { color: '#1A5CFF' },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  sub: { fontSize: 14, color: '#888', lineHeight: 20, marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 14, fontSize: 14, color: '#333', marginBottom: 16 },
  error: { color: '#ff3b30', fontSize: 13, marginBottom: 16, textAlign: 'center' },
  primaryBtn: { backgroundColor: '#1A5CFF', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  btnDisabled: { backgroundColor: '#7BA7FF' },
  backBtn: { marginBottom: 20 },
  backBtnText: { color: '#1A5CFF', fontSize: 14, fontWeight: '600' },
  planNote: { backgroundColor: '#EEF3FF', borderRadius: 12, padding: 14, marginBottom: 20 },
  planNoteText: { fontSize: 13, color: '#555', lineHeight: 19 },
  planNoteBold: { fontWeight: '700', color: '#1A5CFF' },
});
