'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const router = useRouter();

  async function login(e) {
    e.preventDefault();
    setErr('');
    const sb = createClient();
    if (!sb) { // demo mode
      router.push('/admin');
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
        <p className="text-sm text-stone-500 mt-1">Supabase Auth protected. Create the user in Supabase Dashboard → Authentication.</p>
        <form onSubmit={login} className="flex flex-col gap-3 mt-5">
          <input className="border rounded-xl px-3 py-2.5 text-sm" placeholder="admin@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="border rounded-xl px-3 py-2.5 text-sm" type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className="py-2.5 rounded-xl bg-stone-900 text-white font-bold">Sign in</button>
        </form>
        <p className="text-xs text-stone-400 mt-3">Demo mode (no Supabase keys): any input enters the dashboard.</p>
      </div>
    </div>
  );
}
