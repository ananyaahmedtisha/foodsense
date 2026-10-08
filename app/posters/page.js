import Link from 'next/link';
import { createServerSupabase, isSupabaseConfigured } from '@/lib/supabaseServer';
import { getCategories } from '@/lib/content';
import { demoGallery } from '@/lib/demoData';
import DownloadButton from '@/components/DownloadButton';
import PageHero from '@/components/PageHero';

export const revalidate = 300;

function isImage(url) {
  return !!url && /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);
}

export default async function PostersPage({ searchParams }) {
  const cat = searchParams?.cat;
  const cats = await getCategories('poster');
  let items = demoGallery.filter((g) => g.media_type === 'poster');
  let live = false;
  if (isSupabaseConfigured()) {
    try {
      const sb = createServerSupabase();
      let q = sb.from('media_gallery').select('*').eq('media_type', 'poster').order('created_at', { ascending: false });
      if (cat) q = q.eq('category', cat);
      const { data } = await q;
      live = true;
      items = data?.length || cat ? data || [] : items;
    } catch {}
  } else if (cat) {
    items = [];
  }

  return (
    <div className="py-8">
      <PageHero
        eyebrow="Awareness Gallery"
        title="Posters that teach 🖼️"
        sub="Downloadable awareness posters for dorms and campus clubs."
        tone="teal"
      />
      {cats.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          <Link href="/posters" className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${!cat ? 'bg-stone-900 text-white' : 'bg-white'}`}>All</Link>
          {cats.map((c) => (
            <Link key={c} href={`/posters?cat=${encodeURIComponent(c)}`} className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${cat === c ? 'bg-stone-900 text-white' : 'bg-white'}`}>{c}</Link>
          ))}
        </div>
      )}
      <div className="masonry mt-6">
        {items.map((m) => (
          <div key={m.id} className="bg-white rounded-2xl shadow-soft overflow-hidden">
            {isImage(m.file_url) ? (
              <img src={m.file_url} alt={m.title} className="w-full object-cover" />
            ) : (
              <div className="aspect-[3/4] bg-gradient-to-br from-fresh-light via-cream to-amberwarm-light grid place-items-center text-center p-6">
                <p className="font-display font-extrabold text-xl">{m.title}</p>
              </div>
            )}
            <div className="p-4">
              <p className="font-display font-bold text-sm">{m.title}</p>
              <div className="flex items-center justify-between mt-2">
                <DownloadButton id={m.id} fileUrl={m.file_url} title={m.title} count={m.download_count || 0} />
              </div>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="text-stone-500 mt-6">No posters in this segment yet.</p>}
    </div>
  );
}
