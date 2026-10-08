'use client';
import { useRef, useState } from 'react';

function youtubeId(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtube\.com\/(?:watch\?[^#]*v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? m[1] : null;
}

function isFile(url) {
  return !!url && /\.(mp4|webm)(\?|$)/i.test(url);
}

export default function VideoCard({ video }) {
  const yt = youtubeId(video.file_url);
  const file = !yt && isFile(video.file_url) ? video.file_url : null;
  const [started, setStarted] = useState(false);
  const [views, setViews] = useState(video.download_count || 0);
  const counted = useRef(false);

  async function countOnce() {
    if (counted.current) return;
    counted.current = true;
    try {
      await fetch('/api/downloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: video.id }),
      });
      setViews((v) => v + 1);
    } catch {}
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
      {yt ? (
        started ? (
          <iframe
            className="w-full aspect-video"
            src={`https://www.youtube.com/embed/${yt}?autoplay=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button onClick={() => { setStarted(true); countOnce(); }} className="relative w-full aspect-video group" aria-label={`Play ${video.title}`}>
            <img src={`https://i.ytimg.com/vi/${yt}/hqdefault.jpg`} alt="" className="w-full h-full object-cover" />
            <span className="absolute inset-0 grid place-items-center bg-black/25 group-hover:bg-black/40 transition">
              <span className="w-14 h-14 rounded-full bg-fresh text-white grid place-items-center text-2xl font-bold">▶</span>
            </span>
          </button>
        )
      ) : file ? (
        <video className="w-full aspect-video bg-black" src={file} controls preload="metadata" onPlay={countOnce} />
      ) : (
        <div className="aspect-video w-full bg-stone-900 text-white grid place-items-center">
          <div className="text-center p-6">
            <p className="text-4xl">🦠</p>
            <p className="text-xs mt-3 text-white/50">No video linked yet — add a YouTube link in Admin → About → Posters & Videos</p>
          </div>
        </div>
      )}
      <div className="p-4">
        <p className="font-display font-bold text-sm">{video.title}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-stone-500">{video.category || 'Video'} • 👁 {views} views</span>
          {video.file_url && !yt && !file && (
            <a href={video.file_url} target="_blank" onClick={countOnce} className="text-xs font-bold text-fresh">Open link →</a>
          )}
        </div>
      </div>
    </div>
  );
}
