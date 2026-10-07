'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [demo, setDemo] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const sb = createClient();
    if (!sb) {
      const host = window.location.hostname;
      setDemo(host === 'localhost' || host === '127.0.0.1');
    }
  }, []);

  async function login(e) {
    e.preventDefault();
    setErr('');
    const sb = createClient();
    if (!sb) {
      if (demo) { router.push('/admin'); return; } // local demo only
      setErr('Admin is not connected (missing Supabase keys on the server).');
      return;
    }
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) setErr(error.message);
    else router.push('/admin');
  }

  return (
    <div className="py-16 max-w-sm mx-auto">
      <div className="bg-white rounded-2xl shadow-soft p-8">
        <h1 className="font-display text-2xl font-extrabold">Admin login 🔐</h1>
        <form onSubmit={login} className="flex flex-col gap-3 mt-5">
          <input className="border rounded-xl px-3 py-2.5 text-sm" placeholder="admin@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <div className="relative">
            <input
              className="border rounded-xl px-3 py-2.5 text-sm w-full pr-12"
              type={showPw ? 'text' : 'password'}
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-fresh px-2 py-1"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className="py-2.5 rounded-xl bg-stone-900 text-white font-bold">Sign in</button>
        </form>
        {demo && <p className="text-xs text-stone-400 mt-3">Local demo (no Supabase keys): any input enters the dashboard.</p>}
      </div>
    </div>
  );
}
