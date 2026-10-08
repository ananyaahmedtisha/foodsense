import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith('/admin') || pathname.startsWith('/admin/login') || pathname.startsWith('/admin/reset-password')) {
    return NextResponse.next();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const host = req.nextUrl.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';

  // No Supabase keys: local demo may enter, production is always sent to login.
  if (!url || !anon || url.includes('xyzcompany') || anon.includes('paste-')) {
    if (isLocal) return NextResponse.next();
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  let res = NextResponse.next();
  const sb = createServerClient(url, anon, {
    cookies: {
      get: (n) => req.cookies.get(n)?.value,
      set: (n, v, o) => res.cookies.set(n, v, o),
      remove: (n, o) => res.cookies.set(n, '', o),
    },
  });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/admin/login', req.url));
  return res;
}

export const config = { matcher: ['/admin/:path*'] };
