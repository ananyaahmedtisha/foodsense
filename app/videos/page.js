import Link from 'next/link';
import { createServerSupabase, isSupabaseConfigured } from '@/lib/supabaseServer';
import { getCategories } from '@/lib/content';
import { demoGallery } from '@/lib/demoData';

function youtubeId(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtube\.com\/(?:watch\?[^#]*v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? m[1] : null;
}

function isFile(url) {
  return !!url && /\.(mp4|webm)(\?|$)/i.test(url);
}

export default async function VideosPage({ searchParams }) {
  const cat = searchParams?.cat;
  const cats = await getCategories('video');
  let items = demoGallery.filter((g) => g.media_type === 'video');
  if (isSupabaseConfigured()) {
    try {
      const sb = createServerSupabase();
      let q = sb.from('media_gallery').select('*').eq('media_type', 'video').order('created_at', { ascending: false });
      if (cat) q = q.eq('category', cat);
      const { data } = await q;
      items = data?.length || cat ? data || [] : items;
    } catch {}
  } else if (cat) {
    items = [];
  }

  return (
    <div className="py-8">
      <h1 className="font-display text-3xl font-extrabold">Visual Learning 🎬</h1>
      <p className="text-stone-500 mt-1">Short videos explaining microbes & food safety — including YouTube embeds that play right here.</p>
      {cats.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          <Link href="/videos" className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${!cat ? 'bg-stone-900 text-white' : 'bg-white'}`}>All</Link>
          {cats.map((c) => (
            <Link key={c} href={`/videos?cat=${encodeURIComponent(c)}`} className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${cat === c ? 'bg-stone-900 text-white' : 'bg-white'}`}>{c}</Link>
          ))}
        </div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
        {items.map((v) => {
          const yt = youtubeId(v.file_url);
          const file = !yt && isFile(v.file_url) ? v.file_url : null;
          return (
            <div key={v.id} className="bg-white rounded-2xl shadow-soft overflow-hidden">
              {yt ? (
                <iframe
                  className="w-full aspect-video"
                  src={`https://www.youtube.com/embed/${yt}`}
                  title={v.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : file ? (
                <video className="w-full aspect-video bg-black" src={file} controls preload="metadata" />
              ) : (
                <div className="aspect-video w-full bg-stone-900 text-white grid place-items-center">
                  <div className="text-center p-6">
                    <p className="text-4xl">🦠</p>
                    <p className="text-xs mt-3 text-white/50">No video linked yet — add a YouTube link in Admin → Posters & Videos</p>
                  </div>
                </div>
              )}
              <div className="p-4">
                <p className="font-display font-bold text-sm">{v.title}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-stone-500">{v.category || 'Video'} • 👁 {v.download_count || 0} views</span>
                  {v.file_url && !yt && !file && <a href={v.file_url} target="_blank" className="text-xs font-bold text-fresh">Open link →</a>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {items.length === 0 && <p className="text-stone-500 mt-6">No videos in this segment yet.</p>}
    </div>
  );
}
