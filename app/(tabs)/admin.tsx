import { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Plan = 'starter' | 'growth' | 'pro';

const videos = [
  { initials: 'MR', name: 'Maria Rodriguez', role: 'Engineer · 1:24 · 312 views', color: '#1A5CFF', status: 'Live' },
  { initials: 'JL', name: 'James Liu', role: 'Designer · 2:01 · 198 views', color: '#1D9E75', status: 'Live' },
  { initials: 'SK', name: 'Alex Chen', role: 'Marketing · 1:12 · Under review', color: '#BA7517', status: 'Pending' },
];

const plans = [
  {
    id: 'starter' as Plan,
    name: 'Starter',
    monthlyPrice: 0,
    annualPrice: 0,
    color: '#888',
    badge: null,
    features: ['1 employee video', 'Unlimited job seeker chats', 'Basic company profile'],
    limit: '1 video max',
  },
  {
    id: 'growth' as Plan,
    name: 'Growth',
    monthlyPrice: 49,
    annualPrice: 39,
    color: '#1A5CFF',
    badge: 'Popular',
    features: ['Up to 5 employee videos', 'Unlimited chats + EN/ES translation', 'Basic analytics dashboard', 'Priority video review'],
    limit: '5 videos max',
  },
  {
    id: 'pro' as Plan,
    name: 'Pro',
    monthlyPrice: 149,
    annualPrice: 119,
    color: '#6C3DE8',
    badge: 'Best value',
    features: ['Unlimited employee videos', 'Unlimited chats + EN/ES translation', 'Full analytics + chat transcripts', 'Priority support', 'Featured company placement'],
    limit: 'Unlimited',
  },
];

export default function AdminScreen() {
  const [currentPlan, setCurrentPlan] = useState<Plan>('starter');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan>('growth');

  const activePlan = plans.find((p) => p.id === currentPlan)!;
  const videoLimit = currentPlan === 'starter' ? 1 : currentPlan === 'growth' ? 5 : 999;
  const videosUsed = videos.filter((v) => v.status === 'Live').length;
  const atLimit = videosUsed >= videoLimit;

  function confirmUpgrade() {
    setCurrentPlan(selectedPlan);
    setShowUpgrade(false);
  }

  return (
    <View style={styles.root}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.label}>Company dashboard</Text>
          <Text style={styles.title}>Apex Technologies</Text>
        </View>

        {/* Metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricVal}>1,204</Text>
            <Text style={styles.metricLbl}>Profile views</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricVal}>{videosUsed}</Text>
            <Text style={styles.metricLbl}>Videos live</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricVal}>47</Text>
            <Text style={styles.metricLbl}>Chats this week</Text>
          </View>
        </View>

        {/* Upload zone */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Employee videos</Text>
          {atLimit ? (
            <View style={styles.lockedZone}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.lockedTitle}>Video limit reached</Text>
              <Text style={styles.lockedSub}>
                Your {activePlan.name} plan allows {videoLimit} video{videoLimit > 1 ? 's' : ''}. Upgrade to add more.
              </Text>
              <TouchableOpacity style={styles.upgradeInlineBtn} onPress={() => setShowUpgrade(true)}>
                <Text style={styles.upgradeInlineBtnText}>Upgrade plan →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadZone}>
              <Text style={styles.uploadIcon}>🎬</Text>
              <Text style={styles.uploadText}>Tap to record or upload</Text>
              <Text style={styles.uploadSub}>MP4, MOV · up to 3 min</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Testimonials */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Active testimonials</Text>
          {videos.map((v, i) => (
            <View key={i} style={styles.videoRow}>
              <View style={[styles.avatar, { backgroundColor: v.color }]}>
                <Text style={styles.avatarText}>{v.initials}</Text>
              </View>
              <View style={styles.videoInfo}>
                <Text style={styles.videoName}>{v.name}</Text>
                <Text style={styles.videoMeta}>{v.role}</Text>
              </View>
              <View style={[styles.statusBadge, v.status === 'Live' ? styles.statusLive : styles.statusPending]}>
                <Text style={[styles.statusText, v.status === 'Live' ? styles.statusLiveText : styles.statusPendingText]}>
                  {v.status}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Subscription */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Subscription</Text>
          <View style={styles.subCard}>
            <View>
              <Text style={styles.subPlan}>{activePlan.name} Plan</Text>
              <Text style={styles.subDetail}>{activePlan.limit}</Text>
            </View>
            <TouchableOpacity
              style={[styles.upgradeBtn, currentPlan === 'pro' && styles.upgradeBtnDisabled]}
              onPress={() => currentPlan !== 'pro' && setShowUpgrade(true)}>
              <Text style={styles.upgradeBtnText}>
                {currentPlan === 'pro' ? 'Max plan' : 'Upgrade'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Upgrade Modal */}
      <Modal visible={showUpgrade} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Choose your plan</Text>
            <Text style={styles.modalSub}>Your employees tell your story. Job seekers ask them directly.</Text>

            {/* Billing toggle */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleOption, !annual && styles.toggleActive]}
                onPress={() => setAnnual(false)}>
                <Text style={[styles.toggleText, !annual && styles.toggleActiveText]}>Monthly</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleOption, annual && styles.toggleActive]}
                onPress={() => setAnnual(true)}>
                <Text style={[styles.toggleText, annual && styles.toggleActiveText]}>Annual</Text>
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>Save 20%</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Plan cards */}
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
                            <Text style={styles.currentBadgeText}>Current</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.planPrice}>
                        {price === 0 ? 'Free' : `$${price}/mo`}
                        {annual && price > 0 && (
                          <Text style={styles.planPriceSub}> billed annually</Text>
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

            {/* CTA */}
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
                  ? 'Already on this plan'
                  : selectedPlan === 'starter'
                  ? 'Downgrade to Free'
                  : `Upgrade to ${plans.find((p) => p.id === selectedPlan)?.name}`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dismissBtn} onPress={() => setShowUpgrade(false)}>
              <Text style={styles.dismissText}>Maybe later</Text>
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
  label: { fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.8 },
  title: { fontSize: 20, fontWeight: '700', color: 'white', marginTop: 4 },
  metricsRow: { flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  metric: { flex: 1, padding: 14, alignItems: 'center', borderRightWidth: 0.5, borderRightColor: '#eee' },
  metricVal: { fontSize: 20, fontWeight: '700', color: '#1A5CFF' },
  metricLbl: { fontSize: 10, color: '#888', marginTop: 2 },
  section: { padding: 16, paddingBottom: 0 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 10 },
  uploadZone: { borderWidth: 1.5, borderColor: '#ddd', borderStyle: 'dashed', borderRadius: 12, padding: 24, alignItems: 'center' },
  uploadIcon: { fontSize: 28, marginBottom: 6 },
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
  // Modal
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
});
