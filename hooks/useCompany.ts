import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type Company = {
  id: string;
  name: string;
  tagline: string;
  logo_url: string | null;
  about: string | null;
  employee_count: number;
  rating: number;
  recommend_pct: number;
};

export type Employee = {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  years_at_company: string;
};

export type VideoItem = {
  id: string;
  video_url: string;
  duration: string;
  quote: string;
  status: string;
  views: number;
  employees: Employee;
};

export function useCompany(companyId: string) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setCompany(data);
        setLoading(false);
      });
  }, [companyId]);

  return { company, loading, error };
}

export function useVideos(companyId: string) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('videos')
      .select(`*, employees(*)`)
      .eq('company_id', companyId)
      .eq('status', 'live')
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setVideos(data ?? []);
        setLoading(false);
      });
  }, [companyId]);

  return { videos, loading, error };
}

export type CompanyPerk = {
  id: string;
  company_id: string;
  icon: string;
  title: string;
  description: string;
  sort_order: number;
};

export function useCompanyPerks(companyId: string | null) {
  const [perks, setPerks] = useState<CompanyPerk[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!companyId) { setPerks([]); setLoading(false); return; }
    setLoading(true);
    supabase
      .from('company_perks')
      .select('*')
      .eq('company_id', companyId)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        setPerks(data ?? []);
        setLoading(false);
      });
  }, [companyId, tick]);

  function refetch() { setTick((t) => t + 1); }

  return { perks, loading, refetch };
}

export function useAllVideos(companyId: string) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('videos')
      .select(`*, employees(*)`)
      .eq('company_id', companyId)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setVideos(data ?? []);
        setLoading(false);
      });
  }, [companyId, tick]);

  function refetch() { setTick((t) => t + 1); }

  return { videos, loading, error, refetch };
}
