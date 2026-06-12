import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LangToggle from '../../components/LangToggle';
import { useActiveCompany } from '../../contexts/CompanyContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCompany, useCompanyPerks, CompanyPerk } from '../../hooks/useCompany';
import { supabase } from '../../lib/supabase';

export default function HomeScreen() {
  const { companyId, clearCompany } = useActiveCompany();
  const { t } = useLanguage();
  const { company, loading } = useCompany(companyId!);
  const { perks, loading: perksLoading } = useCompanyPerks(companyId);
  const [selectedPerk, setSelectedPerk] = useState<CompanyPerk | null>(null);

  // Track a profile view each time a company page loads
  useEffect(() => {
    if (!companyId) return;
    supabase.rpc('increment_company_views', { company_id_param: companyId });
  }, [companyId]);

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.logo}>WhyWork<Text style={styles.logoAccent}>Here</Text></Text>
            <LangToggle />
          </View>
        </View>

        <View style={styles.companyCard}>
          {loading ? (
            <ActivityIndicator color="#D85A30" size="large" style={styles.loader} />
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
                  <Text style={[styles.statNum, styles.statNumRating]}>
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
  container: { flex: 1, backgroundColor: '#FAF6EF' },
  header: { backgroundColor: '#1C1916', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { fontSize: 20, fontWeight: '700', color: 'white' },
  logoAccent: { color: '#E07B53' },
  companyCard: { backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#EDE5D6', padding: 20, marginHorizontal: 16, marginTop: -24, marginBottom: 8 },
  loader: { paddingVertical: 32 },
  companyLogo: { width: 64, height: 64, borderRadius: 14, backgroundColor: '#FAF6EF', borderWidth: 1, borderColor: '#EDE5D6', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  companyLogoImg: { width: 64, height: 64, borderRadius: 14, marginBottom: 12, backgroundColor: '#FAF6EF', borderWidth: 1, borderColor: '#EDE5D6' },
  companyLogoText: { fontSize: 26, fontWeight: '700', color: '#D85A30' },
  companyName: { fontSize: 24, fontWeight: '700', color: '#1C1916', marginBottom: 2 },
  companyTagline: { fontSize: 14, color: '#6E675C', marginBottom: 18 },
  statsRow: { flexDirection: 'row', gap: 28 },
  statItem: { alignItems: 'flex-start' },
  statNum: { fontSize: 20, fontWeight: '700', color: '#1C1916' },
  statNumRating: { color: '#BA7517' },
  statLbl: { fontSize: 11, color: '#8A8275', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  surveyNote: { fontSize: 11, color: '#8A8275', marginTop: 14 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#26221C', margin: 16, marginBottom: 8 },
  perksGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  perkCard: { backgroundColor: 'white', borderRadius: 12, padding: 14, width: '47%', borderWidth: 1, borderColor: '#EDE5D6' },
  perkIcon: { fontSize: 20, marginBottom: 4 },
  perkTitle: { fontSize: 13, fontWeight: '600', color: '#26221C' },
  perkDesc: { fontSize: 12, color: '#6E675C', marginTop: 2, lineHeight: 15 },
  perkMore: { fontSize: 11, color: '#B5471F', marginTop: 6, fontWeight: '600' },
  aboutCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 8, borderWidth: 1, borderColor: '#EDE5D6' },
  aboutText: { fontSize: 14, color: '#3D382F', lineHeight: 22 },
  ctaBtn: { backgroundColor: '#D85A30', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  ctaBtnText: { color: 'white', fontSize: 15, fontWeight: '600' },
  searchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, marginTop: 4, marginBottom: 32, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#D85A30', backgroundColor: 'white' },
  searchBtnIcon: { fontSize: 16 },
  searchBtnText: { color: '#B5471F', fontSize: 15, fontWeight: '600' },
  // Perk detail modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  detailSheet: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 28, paddingBottom: 44 },
  modalHandle: { width: 36, height: 4, backgroundColor: '#E5DECF', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  detailIcon: { fontSize: 44, marginBottom: 12 },
  detailTitle: { fontSize: 20, fontWeight: '700', color: '#1C1916', marginBottom: 10 },
  detailDesc: { fontSize: 15, color: '#5C564C', lineHeight: 24 },
  detailClose: { marginTop: 28, backgroundColor: '#D85A30', borderRadius: 12, padding: 14, alignItems: 'center' },
  detailCloseText: { color: 'white', fontWeight: '600', fontSize: 15 },
});
