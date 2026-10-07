'use client';
export default function DownloadButton({ id, fileUrl, title }) {
  async function handle() {
    try { await fetch('/api/downloads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); } catch {}
    if (fileUrl) window.open(fileUrl, '_blank');
    else alert(`"${title}" is demo content — upload the PDF in Admin → Media Manager to enable real downloads.`);
  }
  return <button onClick={handle} className="px-4 py-2 rounded-full bg-fresh text-white text-sm font-semibold">Download</button>;
}
