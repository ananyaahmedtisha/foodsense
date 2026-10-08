import Link from 'next/link';
import { ArrowRight, Users } from 'lucide-react';
import { createServerSupabase, isSupabaseConfigured } from '@/lib/supabaseServer';
import { getHomepage } from '@/lib/content';
import { demoPosts, demoGallery } from '@/lib/demoData';

export const dynamic = 'force-dynamic'; // live counter: always read fresh from Supabase

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
      posters: demoGallery.filter((g) => g.media_type === 'poster'),
      participantCount: 127, responseCount: 100, downloadCount: 20, viewCount: 7, live: false,
    };
  }
  try {
    const sb = createServerSupabase();
    const [respResult, postsResult, mediaResult, videosResult, postersResult] = await Promise.all([
      sb.rpc('response_count'),
      sb.from('posts').select('*').eq('published', true).order('created_at', { ascending: false }).limit(2),
      sb.from('media_gallery').select('media_type,download_count'),
      sb.from('media_gallery').select('*').eq('media_type', 'video').order('created_at', { ascending: false }).limit(2),
      sb.from('media_gallery').select('*').eq('media_type', 'poster').order('created_at', { ascending: false }).limit(2),
    ]);
    let dl = 0;
    let vw = 0;
    if (mediaResult.data) {
      for (const m of mediaResult.data) {
        if (m.media_type === 'video') vw += m.download_count || 0;
        else dl += m.download_count || 0;
      }
    }
    const responses = respResult.data ?? 0;
    return {
      hero,
      posts: postsResult.data?.length ? postsResult.data : [],
      videos: videosResult.data || [],
      posters: postersResult.data || [],
      participantCount: responses + dl + vw,
      responseCount: responses,
      downloadCount: dl,
      viewCount: vw,
      live: true,
    };
  } catch {
    return { hero, posts: [], videos: [], posters: [], participantCount: 0, responseCount: 0, downloadCount: 0, viewCount: 0, live: false };
  }
}

export default async function Home() {
  const data = await getData();
  const goal = Number(data.hero.goal || process.env.NEXT_PUBLIC_IMPACT_GOAL || 400);
  const pct = Math.min(100, Math.round((data.participantCount / goal) * 100));

  return (
    <div className="py-8">
      <section className="hero-glow grid md:grid-cols-2 gap-8 items-center bg-white rounded-3xl shadow-soft p-8 md:p-10 border border-fresh/10">
        <div className="rise">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-fresh-light text-fresh-dark">
            ● 100% free • No login needed
          </span>
          <h1 className="font-display text-4xl md:text-[3.4rem] font-extrabold mt-4 leading-[1.05]">
            {data.hero.title_a} <span className="text-transparent bg-clip-text bg-gradient-to-r from-fresh to-labteal">{data.hero.title_b}</span>
          </h1>
          <p className="text-stone-600 mt-4 text-lg leading-relaxed">{data.hero.description}</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/articles" className="px-6 py-3 rounded-full bg-fresh text-white font-semibold flex items-center gap-2 shadow-lift hover:bg-fresh-dark hover:-translate-y-0.5 transition">
              Start reading <ArrowRight size={16} />
            </Link>
            <Link href="/play" className="px-6 py-3 rounded-full bg-stone-900 text-white font-semibold hover:-translate-y-0.5 transition shadow-soft">
              Play & Learn 🎮
            </Link>
          </div>
        </div>

        <div className="rise-1 bg-stone-900 text-white rounded-2xl p-6 shadow-lift">
          <div className="flex items-center justify-between">
            <p className="font-display font-bold flex items-center gap-2">
              <Users size={18} /> Impact Tracker
            </p>
            {data.live && <span className="text-xs px-2 py-1 rounded-full bg-white/15 inline-flex items-center gap-1.5"><span className="anim-pulse-dot inline-block w-1.5 h-1.5 rounded-full bg-fresh" />LIVE</span>}
          </div>
          <p className="text-5xl font-display font-extrabold mt-4">
            {data.participantCount}
            <span className="text-lg font-medium text-white/70"> / {goal} engagements</span>
          </p>
          <div className="h-3 bg-white/15 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-fresh" style={{ width: pct + '%' }} />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="font-bold text-lg">{data.responseCount}</p>
              <p className="text-white/60 text-xs">survey responses</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="font-bold text-lg">{data.downloadCount}</p>
              <p className="text-white/60 text-xs">poster downloads</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="font-bold text-lg">{data.viewCount}</p>
              <p className="text-white/60 text-xs">video views</p>
            </div>
          </div>
          <p className="text-xs text-white/60 mt-3">Engagements = survey responses + poster downloads + video views. Goal: {goal}, {data.hero.period}.</p>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6 rise-1">
        {[
          { href: '/articles', emoji: '📚', label: 'Science Pantry', bg: 'from-amber-100 to-amber-50' },
          { href: '/posters', emoji: '🖼️', label: 'Awareness Gallery', bg: 'from-teal-50 to-emerald-50' },
          { href: '/videos', emoji: '🎬', label: 'Visual Learning', bg: 'from-sky-100 to-teal-50' },
          { href: '/surveys', emoji: '📋', label: 'Campus Pulse', bg: 'from-emerald-50 to-green-50' },
          { href: '/calories', emoji: '🍛', label: 'Calorie Counter', bg: 'from-orange-100 to-amber-50' },
          { href: '/play', emoji: '🎮', label: 'Play & Learn', bg: 'from-green-50 to-teal-50' },
        ].map((t) => (
          <Link key={t.href} href={t.href} className={`bg-gradient-to-br ${t.bg} dark:from-stone-800 dark:to-stone-900 border border-white/70 dark:border-stone-700 rounded-2xl p-4 shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition flex items-center gap-3`}>
            <span className="text-3xl">{t.emoji}</span>
            <span className="font-display font-bold text-[15px] leading-tight text-stone-800 dark:text-white">{t.label}</span>
          </Link>
        ))}
      </section>

      <section className="mt-10 rise-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-extrabold">Latest from the Pantry</h2>
          <Link href="/articles" className="text-sm font-semibold text-fresh">View all →</Link>
        </div>
        {data.posts.length ? (
          <div className="grid md:grid-cols-2 gap-4">
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

      {data.posters?.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-extrabold">Fresh Posters</h2>
            <Link href="/posters" className="text-sm font-semibold text-fresh">All posters →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {data.posters.map((m) => (
              <Link key={m.id} href="/posters" className="bg-white rounded-2xl shadow-soft overflow-hidden hover:shadow-lift transition">
                {m.file_url && /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(m.file_url) ? (
                  <img src={m.file_url} alt={m.title} className="w-full aspect-[4/3] object-cover" />
                ) : (
                  <div className="aspect-[4/3] bg-gradient-to-br from-fresh-light via-cream to-amberwarm-light grid place-items-center text-center p-4">
                    <p className="font-display font-bold">{m.title}</p>
                  </div>
                )}
                <p className="p-3 text-sm font-display font-bold truncate">{m.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {data.videos.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-extrabold">Watch & Learn</h2>
            <Link href="/videos" className="text-sm font-semibold text-fresh">All videos →</Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
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
