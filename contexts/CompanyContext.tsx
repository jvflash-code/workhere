import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

type CompanyContextType = {
  companyId: string | null;
  companySlug: string | null;
  setCompanyBySlug: (slug: string) => Promise<boolean>;
  setCompanyById: (id: string) => void;
  clearCompany: () => void;
};

const CompanyContext = createContext<CompanyContextType>({
  companyId: null,
  companySlug: null,
  setCompanyBySlug: async () => false,
  setCompanyById: () => {},
  clearCompany: () => {},
});

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companySlug, setCompanySlug] = useState<string | null>(null);

  // Load last viewed company from storage
  useEffect(() => {
    AsyncStorage.getItem('lastCompanyId').then((id) => {
      if (id) setCompanyId(id);
    });
    AsyncStorage.getItem('lastCompanySlug').then((slug) => {
      if (slug) setCompanySlug(slug);
    });
  }, []);

  async function setCompanyBySlug(slug: string): Promise<boolean> {
    const { data } = await supabase
      .from('companies')
      .select('id, slug')
      .eq('slug', slug)
      .single();

    if (data) {
      setCompanyId(data.id);
      setCompanySlug(data.slug);
      AsyncStorage.setItem('lastCompanyId', data.id);
      AsyncStorage.setItem('lastCompanySlug', data.slug);
      return true;
    }
    return false;
  }

  function setCompanyById(id: string) {
    setCompanyId(id);
    AsyncStorage.setItem('lastCompanyId', id);
  }

  function clearCompany() {
    setCompanyId(null);
    setCompanySlug(null);
    AsyncStorage.removeItem('lastCompanyId');
    AsyncStorage.removeItem('lastCompanySlug');
  }

  return (
    <CompanyContext.Provider value={{ companyId, companySlug, setCompanyBySlug, setCompanyById, clearCompany }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useActiveCompany() {
  return useContext(CompanyContext);
}
