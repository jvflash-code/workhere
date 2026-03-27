import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LangToggle from '../../components/LangToggle';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCompany } from '../../hooks/useCompany';

const COMPANY_ID = '00000000-0000-0000-0000-000000000001';

export default function HomeScreen() {
  const { t } = useLanguage();
  const { company, loading } = useCompany(COMPANY_ID);

  const perks = [
    { icon: '🏥', title: t('perk1Title'), desc: t('perk1Desc') },
    { icon: '📈', title: t('perk2Title'), desc: t('perk2Desc') },
    { icon: '🌴', title: t('perk3Title'), desc: t('perk3Desc') },
    { icon: '🎓', title: t('perk4Title'), desc: t('perk4Desc') },
  ];

  return (
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
            <View style={styles.companyLogo}>
              <Text style={styles.companyLogoText}>
                {company?.name ? company.name.charAt(0) : 'A'}
              </Text>
            </View>
            <Text style={styles.companyName}>{company?.name ?? '—'}</Text>
            <Text style={styles.companyTagline}>{company?.tagline ?? ''}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>
                  {company?.employee_count != null
                    ? company.employee_count.toLocaleString()
                    : '—'}
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
          </>
        )}
      </View>

      <Text style={styles.sectionLabel}>{t('whyWorkHere')}</Text>
      <View style={styles.perksGrid}>
        {perks.map((perk, i) => (
          <View key={i} style={styles.perkCard}>
            <Text style={styles.perkIcon}>{perk.icon}</Text>
            <Text style={styles.perkTitle}>{perk.title}</Text>
            <Text style={styles.perkDesc}>{perk.desc}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.ctaBtn}>
        <Text style={styles.ctaBtnText}>{t('watchVideos')}</Text>
      </TouchableOpacity>
    </ScrollView>
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
  companyLogoText: { fontSize: 24, fontWeight: '700', color: '#1A5CFF' },
  companyName: { fontSize: 22, fontWeight: '700', color: 'white', marginBottom: 2 },
  companyTagline: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 24 },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '700', color: 'white' },
  statLbl: { fontSize: 10, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#333', margin: 16, marginBottom: 8 },
  perksGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  perkCard: { backgroundColor: 'white', borderRadius: 10, padding: 12, width: '47%' },
  perkIcon: { fontSize: 20, marginBottom: 4 },
  perkTitle: { fontSize: 12, fontWeight: '600', color: '#333' },
  perkDesc: { fontSize: 11, color: '#888', marginTop: 2 },
  ctaBtn: { backgroundColor: '#1A5CFF', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  ctaBtnText: { color: 'white', fontSize: 15, fontWeight: '600' },
});
