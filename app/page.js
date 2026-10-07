import Link from 'next/link';
import { ArrowRight, Users } from 'lucide-react';
import { createServerSupabase, isSupabaseConfigured } from '@/lib/supabaseServer';
import { getHomepage } from '@/lib/content';
import { demoPosts, demoGallery } from '@/lib/demoData';

function youtubeId(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtube\.com\/(?:watch\?[^#]*v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? m[1] : null;
}

async function getData() {
  const hero = await getHomepage();
  if (!isSupabaseConfigured()) {
    return {
      hero, posts: demoPosts,
      videos: demoGallery.filter((g) => g.media_type === 'video'),
      participantCount: 127, responseCount: 100, downloadCount: 27, live: false,
    };
  }
  try {
    const sb = createServerSupabase();
    const [respResult, postsResult, mediaResult, videosResult] = await Promise.all([
      sb.from('survey_responses').select('*', { count: 'exact', head: true }),
      sb.from('posts').select('*').eq('published', true).order('created_at', { ascending: false }).limit(3),
      sb.from('media_gallery').select('download_count'),
      sb.from('media_gallery').select('*').eq('media_type', 'video').order('created_at', { ascending: false }).limit(3),
    ]);
    let dl = 0;
    if (mediaResult.data) {
      for (const m of mediaResult.data) dl += m.download_count || 0;
    }
    const responses = respResult.count ?? 0;
    return {
      hero,
      posts: postsResult.data?.length ? postsResult.data : [],
      videos: videosResult.data || [],
      participantCount: responses + dl,
      responseCount: responses,
      downloadCount: dl,
      live: true,
    };
  } catch {
    return { hero, posts: [], videos: [], participantCount: 0, responseCount: 0, downloadCount: 0, live: false };
  }
}

export default async function Home() {
  const data = await getData();
  const goal = Number(process.env.NEXT_PUBLIC_IMPACT_GOAL || 400);
  const pct = Math.min(100, Math.round((data.participantCount / goal) * 100));

  return (
    <div className="py-8">
      <section className="grid md:grid-cols-2 gap-8 items-center bg-white rounded-3xl shadow-soft p-8">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold mt-4 leading-tight">
            {data.hero.title_a} <span className="text-fresh">{data.hero.title_b}</span>
          </h1>
          <p className="text-stone-600 mt-4">{data.hero.description}</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/articles" className="px-5 py-3 rounded-full bg-fresh text-white font-semibold flex items-center gap-2">
              Start reading <ArrowRight size={16} />
            </Link>
            <Link href="/play" className="px-5 py-3 rounded-full bg-stone-900 text-white font-semibold">
              Play & Learn 🎮
            </Link>
          </div>
        </div>

        <div className="bg-stone-900 text-white rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <p className="font-display font-bold flex items-center gap-2">
              <Users size={18} /> Impact Tracker
            </p>
            {data.live && <span className="text-xs px-2 py-1 rounded-full bg-white/15">LIVE</span>}
          </div>
          <p className="text-5xl font-display font-extrabold mt-4">
            {data.participantCount}
            <span className="text-lg font-medium text-white/70"> / {goal} lives</span>
          </p>
          <div className="h-3 bg-white/15 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-fresh" style={{ width: pct + '%' }} />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="font-bold text-lg">{data.responseCount}</p>
              <p className="text-white/60 text-xs">survey responses — one per participant</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="font-bold text-lg">{data.downloadCount}</p>
              <p className="text-white/60 text-xs">poster downloads — counted on every click</p>
            </div>
          </div>
          <p className="text-xs text-white/60 mt-3">Lives = survey responses + poster downloads. Goal: 301–400 lives, Aug–Nov 2026.</p>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-extrabold">Latest from the Pantry</h2>
          <Link href="/articles" className="text-sm font-semibold text-fresh">View all →</Link>
        </div>
        {data.posts.length ? (
          <div className="grid md:grid-cols-3 gap-4">
            {data.posts.map((p) => (
              <Link key={p.slug || p.id} href={'/articles/' + p.slug} className="bg-white rounded-2xl shadow-soft overflow-hidden hover:shadow-lift transition">
                {p.cover_image_url ? (
                  <img src={p.cover_image_url} alt="" className="h-36 w-full object-cover" />
                ) : (
                  <div className="h-36 bg-gradient-to-br from-fresh-light via-cream to-labteal-light grid place-items-center text-4xl">🥗</div>
                )}
                <div className="p-5">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cream border">{p.category}</span>
                  <p className="font-display font-bold mt-2 leading-snug">{p.title}</p>
                  <p className="text-sm text-stone-500 mt-1">{p.excerpt || ''}</p>
                  <p className="text-xs text-stone-400 mt-2">{p.reading_minutes || 5} min read</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-500">New articles are on the way — publish the first one in Admin → Articles.</p>
        )}
      </section>

      {data.videos.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-extrabold">Watch & Learn</h2>
            <Link href="/videos" className="text-sm font-semibold text-fresh">All videos →</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {data.videos.map((v) => {
              const yt = youtubeId(v.file_url);
              return (
                <Link key={v.id} href="/videos" className="bg-white rounded-2xl shadow-soft overflow-hidden hover:shadow-lift transition">
                  {yt ? (
                    <img src={`https://i.ytimg.com/vi/${yt}/hqdefault.jpg`} alt="" className="w-full aspect-video object-cover" />
                  ) : (
                    <div className="aspect-video bg-stone-900 text-white grid place-items-center text-4xl">🎬</div>
                  )}
                  <div className="p-4">
                    <p className="font-display font-bold text-sm">▶ {v.title}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
