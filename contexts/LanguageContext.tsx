import { createContext, useContext, useState } from 'react';
import { getLocales } from 'expo-localization';
import translations, { Lang, TranslationKey } from '../constants/translations';

type LanguageContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  toggle: () => void;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

function detectDefaultLang(): Lang {
  try {
    const locales = getLocales();
    const code = locales[0]?.languageCode ?? 'en';
    return code === 'es' ? 'es' : 'en';
  } catch {
    return 'en';
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(detectDefaultLang);

  function t(key: TranslationKey): string {
    return translations[lang][key] ?? translations.en[key] ?? key;
  }

  function toggle() {
    setLang((prev) => (prev === 'en' ? 'es' : 'en'));
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, toggle }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
