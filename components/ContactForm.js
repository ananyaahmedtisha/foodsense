'use client';
import { useState } from 'react';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');

  async function send(e) {
    e.preventDefault();
    setStatus('Sending…');
    const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const j = await res.json();
    if (j.ok) { setStatus('Message sent. We reply within 2 days.'); setForm({ name: '', email: '', message: '' }); }
    else setStatus('Error: ' + (j.error || 'failed'));
  }

  return (
    <form onSubmit={send} className="flex flex-col gap-2.5 mt-3">
      <input className="border rounded-xl px-3 py-2.5 text-sm" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <input className="border rounded-xl px-3 py-2.5 text-sm" placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <textarea className="border rounded-xl px-3 py-2.5 text-sm" rows={4} placeholder="Workshop invite, question, poster request…" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
      <button className="py-2.5 rounded-xl bg-fresh text-white text-sm font-bold">Send message</button>
      {status && <p className="text-xs">{status}</p>}
    </form>
  );
}
