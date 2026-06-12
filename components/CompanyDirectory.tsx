import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { useActiveCompany } from '../contexts/CompanyContext';

type CompanyRow = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  employee_count: number;
  rating: number;
};

export default function CompanyDirectory() {
  const { setCompanyById } = useActiveCompany();
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [filtered, setFiltered] = useState<CompanyRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('companies')
      .select('id, name, slug, tagline, employee_count, rating')
      .order('name')
      .then(({ data }) => {
        setCompanies(data ?? []);
        setFiltered(data ?? []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(companies);
    } else {
      const q = search.toLowerCase();
      setFiltered(companies.filter((c) => c.name.toLowerCase().includes(q)));
    }
  }, [search, companies]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>WhyWork<Text style={styles.logoAccent}>Here</Text></Text>
        <Text style={styles.sub}>Find a company to explore</Text>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search companies..."
          placeholderTextColor="#9A9285"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator color="#D85A30" size="large" style={styles.loader} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No companies found</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => setCompanyById(item.id)}>
              <View style={styles.cardLogo}>
                <Text style={styles.cardLogoText}>{item.name.charAt(0)}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardTagline} numberOfLines={1}>{item.tagline}</Text>
                <View style={styles.cardMeta}>
                  {item.rating > 0 && <Text style={styles.cardStat}>{item.rating}★</Text>}
                  {item.employee_count > 0 && <Text style={styles.cardStat}>{item.employee_count.toLocaleString()} employees</Text>}
                </View>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF6EF' },
  header: { backgroundColor: '#1C1916', padding: 24, paddingTop: 60, paddingBottom: 20 },
  logo: { fontSize: 28, fontWeight: '700', color: 'white' },
  logoAccent: { color: '#E07B53' },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.88)', marginTop: 6 },
  searchWrap: { padding: 12 },
  searchInput: { backgroundColor: 'white', borderRadius: 12, padding: 14, fontSize: 14, color: '#26221C', borderWidth: 1, borderColor: '#EDE7D9' },
  loader: { marginTop: 60 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#6E675C', fontSize: 14 },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: '#EDE5D6' },
  cardLogo: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#D85A30', alignItems: 'center', justifyContent: 'center' },
  cardLogoText: { fontSize: 20, fontWeight: '700', color: 'white' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#26221C' },
  cardTagline: { fontSize: 13, color: '#6E675C', marginTop: 2 },
  cardMeta: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cardStat: { fontSize: 12, color: '#B5471F', fontWeight: '600' },
  arrow: { fontSize: 18, color: '#C9C2B3' },
});
