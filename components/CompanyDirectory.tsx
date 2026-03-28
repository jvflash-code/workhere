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
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator color="#1A5CFF" size="large" style={styles.loader} />
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#1A5CFF', padding: 24, paddingTop: 60, paddingBottom: 20 },
  logo: { fontSize: 28, fontWeight: '700', color: 'white' },
  logoAccent: { color: '#7BB3FF' },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 6 },
  searchWrap: { padding: 12 },
  searchInput: { backgroundColor: 'white', borderRadius: 12, padding: 14, fontSize: 14, color: '#333', borderWidth: 1, borderColor: '#eee' },
  loader: { marginTop: 60 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#888', fontSize: 14 },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 8, gap: 12 },
  cardLogo: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#1A5CFF', alignItems: 'center', justifyContent: 'center' },
  cardLogoText: { fontSize: 20, fontWeight: '700', color: 'white' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#333' },
  cardTagline: { fontSize: 12, color: '#888', marginTop: 2 },
  cardMeta: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cardStat: { fontSize: 11, color: '#1A5CFF', fontWeight: '600' },
  arrow: { fontSize: 18, color: '#ccc' },
});
