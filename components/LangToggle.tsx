import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';

export default function LangToggle() {
  const { lang, toggle } = useLanguage();

  return (
    <TouchableOpacity style={styles.pill} onPress={toggle} activeOpacity={0.8}>
      <View style={[styles.option, lang === 'en' && styles.active]}>
        <Text style={[styles.text, lang === 'en' && styles.activeText]}>🇺🇸 EN</Text>
      </View>
      <View style={[styles.option, lang === 'es' && styles.active]}>
        <Text style={[styles.text, lang === 'es' && styles.activeText]}>🇲🇽 ES</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 3,
  },
  option: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 18,
  },
  active: {
    backgroundColor: 'white',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  activeText: {
    color: '#1A5CFF',
  },
});
