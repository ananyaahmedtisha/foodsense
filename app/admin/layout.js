import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabaseServer';

const tabs = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/homepage', label: 'Homepage' },
  { href: '/admin/posts', label: 'Articles' },
  { href: '/admin/media', label: 'Posters & Videos' },
  { href: '/admin/team', label: 'Team' },
  { href: '/admin/surveys', label: 'Surveys' },
  { href: '/admin/categories', label: 'Segments' },
  { href: '/admin/games', label: 'Games' },
  { href: '/admin/contact', label: 'Contact' },
];

export default async function AdminLayout({ children }) {
  let loggedIn = false;
  try {
    const sb = createServerSupabase();
    if (sb) {
      const { data: { user } } = await sb.auth.getUser();
      loggedIn = !!user;
    }
  } catch {}

  // Login page (logged out): bare shell, no dashboard tabs.
  if (!loggedIn) {
    return <div className="py-8">{children}</div>;
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold">Admin Dashboard</h1>
        <Link href="/" className="text-sm font-semibold text-fresh">← View site</Link>
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} className="px-4 py-2 rounded-full bg-white border text-sm font-semibold hover:bg-stone-900 hover:text-white">{t.label}</Link>
        ))}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
