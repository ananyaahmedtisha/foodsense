import Link from 'next/link';
import { createServerSupabase, isSupabaseConfigured } from '@/lib/supabaseServer';
import { getCategories } from '@/lib/content';
import { demoPosts } from '@/lib/demoData';
import PageHero from '@/components/PageHero';

export const revalidate = 300;

export default async function ArticlesPage({ searchParams }) {
  const cat = searchParams?.cat;
  const cats = await getCategories('article');
  let posts = demoPosts;
  if (isSupabaseConfigured()) {
    try {
      const sb = createServerSupabase();
      let q = sb.from('posts').select('*').eq('published', true).order('created_at', { ascending: false });
      if (cat) q = q.eq('category', cat);
      const { data } = await q;
      if (data?.length) posts = data;
      else if (cat) posts = [];
    } catch {}
  } else if (cat) {
    posts = demoPosts.filter((p) => p.category === cat);
  }

  return (
    <div className="py-8">
      <PageHero
        eyebrow="Science Pantry"
        title="Short reads, zero jargon 📚"
        sub="Hostel storage, label tricks, and microbe safety — 5 minutes each."
        tone="amber"
      />
      <div className="flex flex-wrap gap-2 mt-6">
        <Link href="/articles" className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${!cat ? 'bg-stone-900 text-white' : 'bg-white'}`}>All</Link>
        {cats.map((c) => (
          <Link key={c} href={`/articles?cat=${encodeURIComponent(c)}`} className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${cat === c ? 'bg-stone-900 text-white' : 'bg-white'}`}>{c}</Link>
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-4 mt-6">
        {posts.map((p, i) => (
          <Link key={p.id} href={`/articles/${p.slug}`} className="anim-fade-up bg-white rounded-2xl shadow-soft overflow-hidden hover:shadow-lift transition" style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}>
            {p.cover_image_url ? (
              <img src={p.cover_image_url} alt="" className="h-36 w-full object-cover" />
            ) : (
              <div className="h-36 bg-gradient-to-br from-fresh-light to-labteal-light grid place-items-center text-4xl">🔬</div>
            )}
            <div className="p-5">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cream border">{p.category}</span>
              <p className="font-display font-bold mt-2">{p.title}</p>
              <p className="text-sm text-stone-500 mt-1 line-clamp-2">{p.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
      {posts.length === 0 && <p className="text-stone-500 mt-8">No articles yet in this category.</p>}
    </div>
  );
}
