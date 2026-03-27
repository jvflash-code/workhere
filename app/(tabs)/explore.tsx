import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LangToggle from '../../components/LangToggle';
import { useLanguage } from '../../contexts/LanguageContext';

export default function VideosScreen() {
  const { t } = useLanguage();

  const videos = [
    { initials: 'MR', name: 'Maria Rodriguez', role: t('roleSoftwareEngineer'), years: '3 yrs', duration: '1:24', color: '#1A5CFF', quote: t('quote1') },
    { initials: 'JL', name: 'James Liu', role: t('roleDesigner'), years: '5 yrs', duration: '2:01', color: '#1D9E75', quote: t('quote2') },
    { initials: 'SK', name: 'Sara Kim', role: t('rolePM'), years: '2 yrs', duration: '1:45', color: '#BA7517', quote: t('quote3') },
    { initials: 'TP', name: 'Tom Parker', role: t('roleSales'), years: '4 yrs', duration: '0:58', color: '#993556', quote: t('quote4') },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>{t('testimonials')}</Text>
            <Text style={styles.sub}>{t('hearFromTeam')}</Text>
          </View>
          <LangToggle />
        </View>
      </View>

      {videos.map((v, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={[styles.avatar, { backgroundColor: v.color }]}>
              <Text style={styles.avatarText}>{v.initials}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.name}>{v.name}</Text>
              <Text style={styles.role}>{v.role} · {v.years}</Text>
            </View>
          </View>
          <View style={styles.videoThumb}>
            <View style={styles.playBtn}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
            <Text style={styles.duration}>{v.duration}</Text>
          </View>
          <Text style={styles.quote}>{v.quote}</Text>
          <TouchableOpacity style={styles.askBtn}>
            <Text style={styles.askBtnText}>{v.name.split(' ')[0]} — {t('askQuestion')}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#1A5CFF', padding: 24, paddingTop: 60 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 22, fontWeight: '700', color: 'white' },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  card: { backgroundColor: 'white', margin: 12, marginBottom: 0, borderRadius: 14, padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontWeight: '700', fontSize: 15 },
  cardInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#333' },
  role: { fontSize: 12, color: '#888', marginTop: 2 },
  videoThumb: { backgroundColor: '#f0f4ff', borderRadius: 10, height: 140, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  playBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1A5CFF', alignItems: 'center', justifyContent: 'center' },
  playIcon: { color: 'white', fontSize: 16, marginLeft: 3 },
  duration: { position: 'absolute', bottom: 8, right: 10, fontSize: 11, color: '#888' },
  quote: { fontSize: 13, color: '#555', lineHeight: 20, marginBottom: 12 },
  askBtn: { backgroundColor: '#f0f4ff', padding: 12, borderRadius: 10, alignItems: 'center' },
  askBtnText: { color: '#1A5CFF', fontSize: 13, fontWeight: '600' },
});
