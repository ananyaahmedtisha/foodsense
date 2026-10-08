import Link from 'next/link';
import { createServerSupabase, isSupabaseConfigured } from '@/lib/supabaseServer';
import { getCategories } from '@/lib/content';
import { demoGallery } from '@/lib/demoData';
import VideoCard from '@/components/VideoCard';
import PageHero from '@/components/PageHero';

export const revalidate = 300;

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
      <PageHero
        eyebrow="Visual Learning"
        title="Watch microbes in action 🎬"
        sub="Short videos explaining microbes and food safety — tap to play, views counted automatically."
        tone="green"
      />
      {cats.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          <Link href="/videos" className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${!cat ? 'bg-stone-900 text-white' : 'bg-white'}`}>All</Link>
          {cats.map((c) => (
            <Link key={c} href={`/videos?cat=${encodeURIComponent(c)}`} className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${cat === c ? 'bg-stone-900 text-white' : 'bg-white'}`}>{c}</Link>
          ))}
        </div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
        {items.map((v, i) => (
          <div key={v.id} className="anim-slide-right" style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}>
            <VideoCard video={v} />
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="text-stone-500 mt-6">No videos in this segment yet.</p>}
    </div>
  );
}
