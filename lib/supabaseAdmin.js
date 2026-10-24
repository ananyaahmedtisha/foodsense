import { createClient } from '@supabase/supabase-js';

// Server-side client. Next.js caches fetch() by default inside route handlers,
// which makes admin dashboards show stale data. Always fetch fresh.
const freshFetch = (url, options = {}) => fetch(url, { ...options, cache: 'no-store' });

export function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return null;
  return createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: freshFetch },
  });
}
