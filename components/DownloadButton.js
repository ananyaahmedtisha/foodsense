'use client';
import { useState } from 'react';

export default function DownloadButton({ id, fileUrl, title, count = 0 }) {
  const [n, setN] = useState(count);
  const [busy, setBusy] = useState(false);

  async function handle() {
    if (busy) return;
    if (!fileUrl) {
      alert(`"${title}" has no file attached yet — add one in Admin → Posters & Videos.`);
      return;
    }
    setBusy(true);
    // Count this click first so every tap is recorded even if the file fails.
    try {
      await fetch('/api/downloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setN((c) => c + 1);
    } catch {}

    // Direct download: fetch as blob so the browser saves instead of previewing.
    try {
      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const ext = (fileUrl.split('?')[0].split('.').pop() || 'jpg').slice(0, 4);
      const safe = String(title || 'foodsense-poster').replace(/[^\w\- ]+/g, '').trim().slice(0, 60) || 'foodsense-poster';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${safe}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 8000);
    } catch {
      // External links without download permission (e.g. YouTube) fall back to a new tab.
      window.open(fileUrl, '_blank');
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="flex items-center gap-2">
      <span className="text-xs text-stone-500">⬇ {n} downloads</span>
      <button onClick={handle} disabled={busy} className="px-4 py-2 rounded-full bg-fresh text-white text-sm font-semibold disabled:opacity-60">
        {busy ? 'Saving…' : 'Download'}
      </button>
    </span>
  );
}
