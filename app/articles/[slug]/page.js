import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabase, isSupabaseConfigured } from '@/lib/supabaseServer';
import { demoPosts } from '@/lib/demoData';

export default async function ArticleDetail({ params }) {
  let post = demoPosts.find((p) => p.slug === params.slug);
  if (isSupabaseConfigured()) {
    try {
      const sb = createServerSupabase();
      const { data } = await sb.from('posts').select('*').eq('slug', params.slug).single();
      if (data) post = data;
    } catch {}
  }
  if (!post) return notFound();

  return (
    <article className="py-8 max-w-3xl mx-auto">
      <Link href="/articles" className="text-sm text-fresh font-semibold">← Back to Pantry</Link>
      <span className="ml-3 text-[11px] font-bold px-2.5 py-1 rounded-full bg-cream border">{post.category}</span>
      <h1 className="font-display text-3xl md:text-4xl font-extrabold mt-3 leading-tight">{post.title}</h1>
      <p className="text-sm text-stone-500 mt-2">⏱ {post.reading_minutes || 5} min read • {new Date(post.created_at).toLocaleDateString()}</p>
      {post.cover_image_url ? (
        <img src={post.cover_image_url} alt="" className="w-full max-h-80 object-cover rounded-2xl mt-5" />
      ) : (
        <div className="h-56 rounded-2xl mt-5 bg-gradient-to-br from-fresh-light via-cream to-amberwarm-light grid place-items-center text-6xl">🥘</div>
      )}
      <div className="bg-white rounded-2xl shadow-soft p-6 mt-5 leading-relaxed whitespace-pre-wrap">{post.content || post.excerpt}</div>
      <div className="mt-6 p-5 rounded-2xl bg-labteal-light/50 border border-labteal/20">
        <p className="font-bold">TL;DR for busy students</p>
        <p className="text-sm mt-1">{post.excerpt}</p>
      </div>
    </article>
  );
}
