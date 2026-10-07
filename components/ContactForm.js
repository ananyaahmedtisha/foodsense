'use client';
import { useState } from 'react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  }

  async function send(e) {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Please enter your name.';
    if (!form.email.trim()) errs.email = 'Email is required so we can reply.';
    else if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Please enter a valid email address.';
    if (!form.message.trim()) errs.message = 'Please write your message.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSending(true);
    setStatus('Sending…');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), message: form.message.trim() }),
      });
      const j = await res.json();
      if (j.ok) {
        setStatus('Message sent. We reply within 2 days.');
        setForm({ name: '', email: '', message: '' });
      } else {
        setStatus('Error: ' + (j.error || 'failed to send'));
      }
    } catch {
      setStatus('Error: could not send. Check your connection.');
    } finally {
      setSending(false);
    }
  }

  const input = 'border rounded-xl px-3 py-2.5 text-sm w-full';

  return (
    <form onSubmit={send} noValidate className="flex flex-col gap-2.5 mt-3">
      <div>
        <input className={input} placeholder="Your name" value={form.name} onChange={(e) => set('name', e.target.value)} />
        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
      </div>
      <div>
        <input className={input} type="email" placeholder="Email (required)" value={form.email} onChange={(e) => set('email', e.target.value)} />
        {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
      </div>
      <div>
        <textarea className={input} rows={4} placeholder="Workshop invite, question, poster request…" value={form.message} onChange={(e) => set('message', e.target.value)} />
        {errors.message && <p className="text-xs text-red-600 mt-1">{errors.message}</p>}
      </div>
      <button disabled={sending} className="py-2.5 rounded-xl bg-fresh text-white text-sm font-bold disabled:opacity-60">
        {sending ? 'Sending…' : 'Send message'}
      </button>
      {status && <p className="text-xs">{status}</p>}
    </form>
  );
}
