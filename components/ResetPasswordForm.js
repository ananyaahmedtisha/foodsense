'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';

export default function ResetPasswordForm() {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState('');
  const router = useRouter();

  async function save(e) {
    e.preventDefault();
    if (pw.length < 6) { setMsg('Password must be at least 6 characters.'); return; }
    setMsg('Saving…');
    const sb = createClient();
    const { error } = await sb.auth.updateUser({ password: pw });
    if (error) setMsg('Error: ' + error.message);
    else {
      setMsg('Password updated — taking you to the dashboard.');
      setTimeout(() => router.push('/admin'), 800);
    }
  }

  return (
    <div className="py-16 max-w-sm mx-auto">
      <div className="bg-white rounded-2xl shadow-soft p-8">
        <h1 className="font-display text-2xl font-extrabold">Set new password 🔑</h1>
        <form onSubmit={save} className="flex flex-col gap-3 mt-5">
          <div className="relative">
            <input
              className="border rounded-xl px-3 py-2.5 text-sm w-full pr-12"
              type={show ? 'text' : 'password'}
              placeholder="New password (min 6 characters)"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-fresh px-2 py-1">
              {show ? 'Hide' : 'Show'}
            </button>
          </div>
          {msg && <p className="text-sm">{msg}</p>}
          <button className="py-2.5 rounded-xl bg-stone-900 text-white font-bold">Save password</button>
        </form>
      </div>
    </div>
  );
}
