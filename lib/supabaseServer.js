import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server components / routes must never reuse a cached Supabase response.
const freshFetch = (url, options = {}) => fetch(url, { ...options, cache: 'no-store' });

export function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const cookieStore = cookies();
  return createServerClient(url, anon, {
    global: { fetch: freshFetch },
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
