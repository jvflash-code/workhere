import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LangToggle from '../../components/LangToggle';
import { useActiveCompany } from '../../contexts/CompanyContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCompany, useCompanyPerks, CompanyPerk } from '../../hooks/useCompany';

export default function HomeScreen() {
  const { companyId, clearCompany } = useActiveCompany();
  const { t } = useLanguage();
  const { company, loading } = useCompany(companyId!);
  const { perks, loading: perksLoading } = useCompanyPerks(companyId);
  const [selectedPerk, setSelectedPerk] = useState<CompanyPerk | null>(null);

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.logo}>WhyWork<Text style={styles.logoAccent}>Here</Text></Text>
            <LangToggle />
          </View>
          <Text style={styles.headerSub}>{t('tagline')}</Text>
        </View>

        <View style={styles.companyCard}>
          {loading ? (
            <ActivityIndicator color="white" size="large" style={styles.loader} />
          ) : (
            <>
              {company?.logo_url ? (
                <Image source={{ uri: company.logo_url }} style={styles.companyLogoImg} />
              ) : (
                <View style={styles.companyLogo}>
                  <Text style={styles.companyLogoText}>
                    {company?.name ? company.name.charAt(0) : 'A'}
                  </Text>
                </View>
              )}
              <Text style={styles.companyName}>{company?.name ?? '—'}</Text>
              <Text style={styles.companyTagline}>{company?.tagline ?? ''}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNum}>
                    {company?.employee_count != null ? company.employee_count.toLocaleString() : '—'}
                  </Text>
                  <Text style={styles.statLbl}>{t('employees')}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNum}>
                    {company?.rating != null ? `${company.rating}★` : '—'}
                  </Text>
                  <Text style={styles.statLbl}>{t('rating')}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNum}>
                    {company?.recommend_pct != null ? `${company.recommend_pct}%` : '—'}
                  </Text>
                  <Text style={styles.statLbl}>{t('recommend')}</Text>
                </View>
              </View>
              <Text style={styles.surveyNote}>* Based on internal employee survey</Text>
            </>
          )}
        </View>

        {/* Perks & Benefits */}
        {!perksLoading && perks.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>{t('whyWorkHere')}</Text>
            <View style={styles.perksGrid}>
              {perks.map((perk) => (
                <TouchableOpacity
                  key={perk.id}
                  style={styles.perkCard}
                  onPress={() => setSelectedPerk(perk)}
                  activeOpacity={0.75}>
                  <Text style={styles.perkIcon}>{perk.icon}</Text>
                  <Text style={styles.perkTitle}>{perk.title}</Text>
                  {perk.description ? (
                    <Text style={styles.perkDesc} numberOfLines={2}>{perk.description}</Text>
                  ) : null}
                  <Text style={styles.perkMore}>Tap for more →</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* About */}
        {company?.about && (
          <>
            <Text style={styles.sectionLabel}>About</Text>
            <View style={styles.aboutCard}>
              <Text style={styles.aboutText}>{company.about}</Text>
            </View>
          </>
        )}

        <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/(tabs)/explore')}>
          <Text style={styles.ctaBtnText}>{t('watchVideos')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.searchBtn} onPress={clearCompany}>
          <Text style={styles.searchBtnIcon}>🔍</Text>
          <Text style={styles.searchBtnText}>Search Companies</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Perk Detail Modal */}
      <Modal
        visible={selectedPerk !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedPerk(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedPerk(null)}>
          <Pressable style={styles.detailSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.detailIcon}>{selectedPerk?.icon}</Text>
            <Text style={styles.detailTitle}>{selectedPerk?.title}</Text>
            <Text style={styles.detailDesc}>{selectedPerk?.description}</Text>
            <TouchableOpacity style={styles.detailClose} onPress={() => setSelectedPerk(null)}>
              <Text style={styles.detailCloseText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#1A5CFF', padding: 24, paddingTop: 60 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  logo: { fontSize: 28, fontWeight: '700', color: 'white' },
  logoAccent: { color: '#7BB3FF' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  companyCard: { backgroundColor: '#1A5CFF', padding: 20, paddingTop: 0, paddingBottom: 24 },
  loader: { paddingVertical: 32 },
  companyLogo: { width: 56, height: 56, borderRadius: 12, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  companyLogoImg: { width: 56, height: 56, borderRadius: 12, marginBottom: 10, backgroundColor: 'white' },
  companyLogoText: { fontSize: 24, fontWeight: '700', color: '#1A5CFF' },
  companyName: { fontSize: 22, fontWeight: '700', color: 'white', marginBottom: 2 },
  companyTagline: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 24 },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '700', color: 'white' },
  statLbl: { fontSize: 10, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' },
  surveyNote: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 12 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#333', margin: 16, marginBottom: 8 },
  perksGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  perkCard: { backgroundColor: 'white', borderRadius: 10, padding: 12, width: '47%' },
  perkIcon: { fontSize: 20, marginBottom: 4 },
  perkTitle: { fontSize: 12, fontWeight: '600', color: '#333' },
  perkDesc: { fontSize: 11, color: '#888', marginTop: 2, lineHeight: 15 },
  perkMore: { fontSize: 10, color: '#1A5CFF', marginTop: 6, fontWeight: '600' },
  aboutCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 8 },
  aboutText: { fontSize: 14, color: '#444', lineHeight: 22 },
  ctaBtn: { backgroundColor: '#1A5CFF', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  ctaBtnText: { color: 'white', fontSize: 15, fontWeight: '600' },
  searchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, marginTop: 4, marginBottom: 32, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#1A5CFF', backgroundColor: 'white' },
  searchBtnIcon: { fontSize: 16 },
  searchBtnText: { color: '#1A5CFF', fontSize: 15, fontWeight: '600' },
  // Perk detail modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  detailSheet: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 28, paddingBottom: 44 },
  modalHandle: { width: 36, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  detailIcon: { fontSize: 44, marginBottom: 12 },
  detailTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 10 },
  detailDesc: { fontSize: 15, color: '#555', lineHeight: 24 },
  detailClose: { marginTop: 28, backgroundColor: '#1A5CFF', borderRadius: 12, padding: 14, alignItems: 'center' },
  detailCloseText: { color: 'white', fontWeight: '600', fontSize: 15 },
});
