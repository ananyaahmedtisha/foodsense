import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Exchanges the emailed recovery code for a session, then hands off to set a new password.
export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = '/admin/reset-password';

  if (!code) return NextResponse.redirect(new URL('/admin/login', req.url));

  const cookieStore = cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (n) => cookieStore.get(n)?.value,
        set: (n, v, o) => cookieStore.set({ name: n, value: v, ...o }),
        remove: (n, o) => cookieStore.set({ name: n, value: '', ...o }),
      },
    }
  );
  const { error } = await sb.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL('/admin/login', req.url));
  return NextResponse.redirect(new URL(next, req.url));
}
