import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type Company = {
  id: string;
  name: string;
  tagline: string;
  logo_url: string | null;
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

export function useAllVideos(companyId: string) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('videos')
      .select(`*, employees(*)`)
      .eq('company_id', companyId)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setVideos(data ?? []);
        setLoading(false);
      });
  }, [companyId]);

  return { videos, loading, error };
}
