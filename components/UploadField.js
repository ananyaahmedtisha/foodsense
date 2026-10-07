'use client';
import { useState } from 'react';

// Reusable image/file uploader → Supabase Storage via /api/admin/upload
export default function UploadField({ folder = 'uploads', accept = 'image/*', value, onUploaded, label = 'Upload image' }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function pick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setErr('');
    try {
      const fd = new FormData();
      fd.append('file', f);
      fd.append('folder', folder);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || 'upload failed');
      onUploaded(j.url);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {value ? (
        <div className="flex items-center gap-3">
          <img src={value} alt="preview" className="w-20 h-20 rounded-xl object-cover border" />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-fresh cursor-pointer hover:underline">
              {busy ? 'Uploading…' : 'Replace'} <input type="file" accept={accept} className="hidden" onChange={pick} />
            </label>
            <button type="button" onClick={() => onUploaded('')} className="text-xs text-red-600">Remove</button>
          </div>
        </div>
      ) : (
        <label className="block border-2 border-dashed rounded-xl p-4 text-center text-sm text-stone-500 cursor-pointer hover:bg-cream">
          {busy ? 'Uploading…' : `+ ${label}`}
          <input type="file" accept={accept} className="hidden" onChange={pick} />
        </label>
      )}
      {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
    </div>
  );
}
