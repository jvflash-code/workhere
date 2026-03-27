import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LangToggle from '../../components/LangToggle';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAllVideos, useCompany, VideoItem } from '../../hooks/useCompany';
import { supabase } from '../../lib/supabase';

const COMPANY_ID = '00000000-0000-0000-0000-000000000001';

type Plan = 'starter' | 'growth' | 'pro';

export default function AdminScreen() {
  const { t } = useLanguage();
  const { company } = useCompany(COMPANY_ID);
  const { videos, loading: videosLoading, refetch } = useAllVideos(COMPANY_ID);
  const [currentPlan, setCurrentPlan] = useState<Plan>('growth');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan>('growth');

  // Upload flow state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [pendingVideoUri, setPendingVideoUri] = useState<string | null>(null);
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState('');
  const [empYears, setEmpYears] = useState('');
  const [videoQuote, setVideoQuote] = useState('');

  const AVATAR_COLORS = ['#1A5CFF', '#6C3DE8', '#1D9E75', '#E8472A', '#F59E0B', '#0EA5E9'];

  const plans = [
    {
      id: 'starter' as Plan,
      name: 'Starter',
      monthlyPrice: 0,
      annualPrice: 0,
      color: '#888',
      badge: null,
      features: [t('starterF1'), t('starterF2'), t('starterF3')],
      limit: t('starterLimit'),
    },
    {
      id: 'growth' as Plan,
      name: 'Growth',
      monthlyPrice: 49,
      annualPrice: 39,
      color: '#1A5CFF',
      badge: t('popular'),
      features: [t('growthF1'), t('growthF2'), t('growthF3'), t('growthF4')],
      limit: t('growthLimit'),
    },
    {
      id: 'pro' as Plan,
      name: 'Pro',
      monthlyPrice: 149,
      annualPrice: 119,
      color: '#6C3DE8',
      badge: t('bestValue'),
      features: [t('proF1'), t('proF2'), t('proF3'), t('proF4'), t('proF5')],
      limit: t('proLimit'),
    },
  ];

  const activePlan = plans.find((p) => p.id === currentPlan)!;
  const videoLimit = currentPlan === 'starter' ? 1 : currentPlan === 'growth' ? 5 : 999;
  const videosUsed = videos.filter((v: VideoItem) => v.status === 'live').length;
  const atLimit = videosUsed >= videoLimit;

  async function handleUpload() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to upload videos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled) {
      setPendingVideoUri(result.assets[0].uri);
      setShowUploadForm(true);
    }
  }

  async function toggleStatus(videoId: string, currentStatus: string) {
    const newStatus = currentStatus === 'live' ? 'pending' : 'live';
    const { error } = await supabase
      .from('videos')
      .update({ status: newStatus })
      .eq('id', videoId);
    if (error) Alert.alert('Error', error.message);
    else refetch();
  }

  function resetUploadForm() {
    setShowUploadForm(false);
    setPendingVideoUri(null);
    setEmpName('');
    setEmpRole('');
    setEmpYears('');
    setVideoQuote('');
    setUploadProgress('');
    setUploading(false);
  }

  async function submitUpload() {
    if (!pendingVideoUri || !empName.trim() || !empRole.trim()) {
      Alert.alert('Missing info', 'Please fill in employee name and role.');
      return;
    }

    setUploading(true);

    try {
      // 1. Create employee record
      setUploadProgress('Creating employee profile...');
      const initials = empName.trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
      const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

      const { data: emp, error: empError } = await supabase
        .from('employees')
        .insert({ company_id: COMPANY_ID, name: empName.trim(), role: empRole.trim(), initials, color, years_at_company: empYears.trim() || '1 year' })
        .select()
        .single();

      if (empError) throw empError;

      // 2. Upload video to Storage
      setUploadProgress('Uploading video...');
      const ext = pendingVideoUri.split('.').pop() ?? 'mp4';
      const fileName = `${COMPANY_ID}/${emp.id}-${Date.now()}.${ext}`;

      const response = await fetch(pendingVideoUri);
      const blob = await response.blob();

      const { error: storageError } = await supabase.storage
        .from('videos')
        .upload(fileName, blob, { contentType: `video/${ext}` });

      if (storageError) throw storageError;

      // 3. Get public URL
      const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(fileName);

      // 4. Insert video record
      setUploadProgress('Saving video record...');
      const { error: videoError } = await supabase
        .from('videos')
        .insert({ company_id: COMPANY_ID, employee_id: emp.id, video_url: publicUrl, duration: '0:00', quote: videoQuote.trim() || '', status: 'pending', views: 0 });

      if (videoError) throw videoError;

      resetUploadForm();
      refetch();
      Alert.alert('Uploaded!', 'Video submitted for review. It will go live once approved.');
    } catch (err: any) {
      setUploading(false);
      setUploadProgress('');
      Alert.alert('Upload failed', err.message ?? 'Something went wrong.');
    }
  }

  function confirmUpgrade() {
    setCurrentPlan(selectedPlan);
    setShowUpgrade(false);
  }

  return (
    <View style={styles.root}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.label}>{t('companyDashboard')}</Text>
              <Text style={styles.title}>{company?.name ?? 'Loading...'}</Text>
            </View>
            <LangToggle />
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricVal}>1,204</Text>
            <Text style={styles.metricLbl}>{t('profileViews')}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricVal}>{videosLoading ? '—' : videosUsed}</Text>
            <Text style={styles.metricLbl}>{t('videosLive')}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricVal}>47</Text>
            <Text style={styles.metricLbl}>{t('chatsThisWeek')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('employeeVideos')}</Text>
          {atLimit ? (
            <View style={styles.lockedZone}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.lockedTitle}>{t('videoLimitTitle')}</Text>
              <Text style={styles.lockedSub}>
                {t('videoLimitDesc')
                  .replace('{plan}', activePlan.name)
                  .replace('{count}', String(videoLimit))
                  .replace('{plural}', videoLimit > 1 ? 's' : '')}
              </Text>
              <TouchableOpacity style={styles.upgradeInlineBtn} onPress={() => setShowUpgrade(true)}>
                <Text style={styles.upgradeInlineBtnText}>{t('upgradePlan')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadZone} onPress={handleUpload}>
              <View style={styles.recordBtn}>
                <View style={styles.recordDot} />
              </View>
              <Text style={styles.uploadText}>{t('tapToUpload')}</Text>
              <Text style={styles.uploadSub}>{t('uploadFormats')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('activeTestimonials')}</Text>
          {videosLoading ? (
            <ActivityIndicator color="#1A5CFF" size="small" style={{ marginVertical: 12 }} />
          ) : (
            videos.map((v: VideoItem) => {
              const emp = v.employees;
              const isLive = v.status === 'live';
              return (
                <View key={v.id} style={styles.videoRow}>
                  <View style={[styles.avatar, { backgroundColor: emp.color }]}>
                    <Text style={styles.avatarText}>{emp.initials}</Text>
                  </View>
                  <View style={styles.videoInfo}>
                    <Text style={styles.videoName}>{emp.name}</Text>
                    <Text style={styles.videoMeta}>
                      {emp.role} · {v.duration} · {v.views} views
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.statusBadge, isLive ? styles.statusLive : styles.statusPending]}
                    onPress={() => toggleStatus(v.id, v.status)}>
                    <Text style={[styles.statusText, isLive ? styles.statusLiveText : styles.statusPendingText]}>
                      {isLive ? t('live') : t('pending')}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('subscription')}</Text>
          <View style={styles.subCard}>
            <View>
              <Text style={styles.subPlan}>{activePlan.name} Plan</Text>
              <Text style={styles.subDetail}>{activePlan.limit}</Text>
            </View>
            <TouchableOpacity
              style={[styles.upgradeBtn, currentPlan === 'pro' && styles.upgradeBtnDisabled]}
              onPress={() => currentPlan !== 'pro' && setShowUpgrade(true)}>
              <Text style={styles.upgradeBtnText}>
                {currentPlan === 'pro' ? t('maxPlan') : t('upgrade')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Upload form modal */}
      <Modal visible={showUploadForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Employee Video</Text>
            <Text style={styles.modalSub}>Fill in the details for this testimonial.</Text>

            <TextInput style={styles.formInput} placeholder="Employee full name *" placeholderTextColor="#aaa" value={empName} onChangeText={setEmpName} editable={!uploading} />
            <TextInput style={styles.formInput} placeholder="Job title / role *" placeholderTextColor="#aaa" value={empRole} onChangeText={setEmpRole} editable={!uploading} />
            <TextInput style={styles.formInput} placeholder="Years at company (e.g. 3 years)" placeholderTextColor="#aaa" value={empYears} onChangeText={setEmpYears} editable={!uploading} />
            <TextInput style={[styles.formInput, styles.formInputMulti]} placeholder="Short quote from the employee" placeholderTextColor="#aaa" value={videoQuote} onChangeText={setVideoQuote} multiline numberOfLines={3} editable={!uploading} />

            {uploading ? (
              <View style={styles.uploadingRow}>
                <ActivityIndicator color="#1A5CFF" />
                <Text style={styles.uploadingText}>{uploadProgress}</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity style={styles.ctaBtn} onPress={submitUpload}>
                  <Text style={styles.ctaBtnText}>Upload Video</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dismissBtn} onPress={resetUploadForm}>
                  <Text style={styles.dismissText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showUpgrade} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('choosePlan')}</Text>
            <Text style={styles.modalSub}>{t('paywallSub')}</Text>

            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleOption, !annual && styles.toggleActive]}
                onPress={() => setAnnual(false)}>
                <Text style={[styles.toggleText, !annual && styles.toggleActiveText]}>{t('monthly')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleOption, annual && styles.toggleActive]}
                onPress={() => setAnnual(true)}>
                <Text style={[styles.toggleText, annual && styles.toggleActiveText]}>{t('annual')}</Text>
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>{t('save20')}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {plans.map((plan) => {
              const price = annual ? plan.annualPrice : plan.monthlyPrice;
              const isSelected = selectedPlan === plan.id;
              const isCurrent = currentPlan === plan.id;

              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[styles.planCard, isSelected && { borderColor: plan.color, borderWidth: 2 }]}
                  onPress={() => !isCurrent && setSelectedPlan(plan.id)}
                  disabled={isCurrent}>
                  <View style={styles.planCardTop}>
                    <View>
                      <View style={styles.planNameRow}>
                        <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
                        {plan.badge && (
                          <View style={[styles.planBadge, { backgroundColor: plan.color }]}>
                            <Text style={styles.planBadgeText}>{plan.badge}</Text>
                          </View>
                        )}
                        {isCurrent && (
                          <View style={styles.currentBadge}>
                            <Text style={styles.currentBadgeText}>{t('current')}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.planPrice}>
                        {price === 0 ? t('free') : `$${price}/mo`}
                        {annual && price > 0 && (
                          <Text style={styles.planPriceSub}> {t('billedAnnually')}</Text>
                        )}
                      </Text>
                    </View>
                    <View style={[styles.radioOuter, isSelected && { borderColor: plan.color }]}>
                      {isSelected && <View style={[styles.radioInner, { backgroundColor: plan.color }]} />}
                    </View>
                  </View>
                  {plan.features.map((f, i) => (
                    <View key={i} style={styles.featureRow}>
                      <Text style={[styles.featureCheck, { color: plan.color }]}>✓</Text>
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  ))}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[
                styles.ctaBtn,
                { backgroundColor: plans.find((p) => p.id === selectedPlan)?.color || '#1A5CFF' },
                selectedPlan === currentPlan && styles.ctaBtnDisabled,
              ]}
              onPress={confirmUpgrade}
              disabled={selectedPlan === currentPlan}>
              <Text style={styles.ctaBtnText}>
                {selectedPlan === currentPlan
                  ? t('alreadyOnPlan')
                  : selectedPlan === 'starter'
                  ? t('downgradeFree')
                  : `${t('upgradeTo')} ${plans.find((p) => p.id === selectedPlan)?.name}`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dismissBtn} onPress={() => setShowUpgrade(false)}>
              <Text style={styles.dismissText}>{t('maybeLater')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#1A5CFF', padding: 24, paddingTop: 60 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  label: { fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.8 },
  title: { fontSize: 20, fontWeight: '700', color: 'white', marginTop: 4 },
  metricsRow: { flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  metric: { flex: 1, padding: 14, alignItems: 'center', borderRightWidth: 0.5, borderRightColor: '#eee' },
  metricVal: { fontSize: 20, fontWeight: '700', color: '#1A5CFF' },
  metricLbl: { fontSize: 10, color: '#888', marginTop: 2 },
  section: { padding: 16, paddingBottom: 0 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 10 },
  uploadZone: { borderWidth: 1.5, borderColor: '#ddd', borderStyle: 'dashed', borderRadius: 12, padding: 24, alignItems: 'center' },
  recordBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff0f0', borderWidth: 2.5, borderColor: '#ff3b30', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  recordDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#ff3b30' },
  uploadText: { fontSize: 13, fontWeight: '600', color: '#1A5CFF' },
  uploadSub: { fontSize: 11, color: '#888', marginTop: 2 },
  lockedZone: { borderWidth: 1.5, borderColor: '#eee', borderStyle: 'dashed', borderRadius: 12, padding: 24, alignItems: 'center', backgroundColor: '#fafafa' },
  lockIcon: { fontSize: 28, marginBottom: 6 },
  lockedTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
  lockedSub: { fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 12 },
  upgradeInlineBtn: { backgroundColor: '#1A5CFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  upgradeInlineBtnText: { color: 'white', fontSize: 13, fontWeight: '600' },
  videoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 10, padding: 12, marginBottom: 8, gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontWeight: '700', fontSize: 13 },
  videoInfo: { flex: 1 },
  videoName: { fontSize: 13, fontWeight: '600', color: '#333' },
  videoMeta: { fontSize: 11, color: '#888', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusLive: { backgroundColor: '#E1F5EE' },
  statusPending: { backgroundColor: '#FAEEDA' },
  statusText: { fontSize: 11, fontWeight: '600' },
  statusLiveText: { color: '#1D9E75' },
  statusPendingText: { color: '#BA7517' },
  subCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 16 },
  subPlan: { fontSize: 14, fontWeight: '600', color: '#333' },
  subDetail: { fontSize: 11, color: '#888', marginTop: 2 },
  upgradeBtn: { backgroundColor: '#1A5CFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  upgradeBtnDisabled: { backgroundColor: '#E1F5EE' },
  upgradeBtnText: { color: 'white', fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48 },
  modalHandle: { width: 36, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#333', textAlign: 'center' },
  modalSub: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 6, marginBottom: 16 },
  toggleRow: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 12, padding: 4, marginBottom: 16 },
  toggleOption: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  toggleActive: { backgroundColor: 'white' },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#888' },
  toggleActiveText: { color: '#333' },
  saveBadge: { backgroundColor: '#1D9E75', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  saveBadgeText: { color: 'white', fontSize: 9, fontWeight: '700' },
  planCard: { borderWidth: 1.5, borderColor: '#eee', borderRadius: 14, padding: 14, marginBottom: 10 },
  planCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  planName: { fontSize: 16, fontWeight: '700' },
  planBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  planBadgeText: { color: 'white', fontSize: 10, fontWeight: '700' },
  currentBadge: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  currentBadgeText: { color: '#888', fontSize: 10, fontWeight: '600' },
  planPrice: { fontSize: 18, fontWeight: '700', color: '#333' },
  planPriceSub: { fontSize: 11, fontWeight: '400', color: '#888' },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  featureCheck: { fontSize: 12, fontWeight: '700' },
  featureText: { fontSize: 12, color: '#555' },
  ctaBtn: { padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  ctaBtnDisabled: { backgroundColor: '#ccc' },
  ctaBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
  dismissBtn: { alignItems: 'center', marginTop: 14 },
  dismissText: { fontSize: 13, color: '#aaa' },
  formInput: { width: '100%', backgroundColor: '#f5f5f5', borderRadius: 10, padding: 13, fontSize: 14, color: '#333', marginBottom: 10 },
  formInputMulti: { height: 80, textAlignVertical: 'top' },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  uploadingText: { fontSize: 13, color: '#888' },
});
