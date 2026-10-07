import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const cookieStore = cookies();
  return createServerClient(url, anon, {
    cookies: {
      get(name) { return cookieStore.get(name)?.value; },
      set(name, value, options) { try { cookieStore.set({ name, value, ...options }); } catch {} },
      remove(name, options) { try { cookieStore.set({ name, value: '', ...options }); } catch {} },
    },
  });
}

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return url && !url.includes('xyzcompany');
}
