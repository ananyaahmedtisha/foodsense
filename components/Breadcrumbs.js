'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

const LABELS = {
  articles: 'Science Pantry',
  posters: 'Awareness Gallery',
  videos: 'Visual Learning',
  surveys: 'Campus Pulse',
  play: 'Play & Learn',
  calories: 'Calorie Counter',
  about: 'About',
  contact: 'Contact',
  admin: 'Admin',
  homepage: 'Homepage',
  posts: 'Articles',
  media: 'Posters & Videos',
  team: 'Team',
  categories: 'Segments',
  games: 'Games',
};

export default function Breadcrumbs() {
  const path = usePathname();
  if (path === '/') return null;

  const segs = path.split('/').filter(Boolean);
  const crumbs = [{ href: '/', label: 'Home' }];
  let href = '';
  for (const s of segs) {
    href += '/' + s;
    if (LABELS[s]) crumbs.push({ href, label: LABELS[s] });
    // Skip dynamic IDs/slugs (article slugs, survey ids) — section crumb is enough.
  }

  return (
    <nav aria-label="Breadcrumb" className="pt-4 flex items-center gap-1 text-[13px]">
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <span key={c.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={13} className="text-stone-300" />}
            {last ? (
              <span className="font-semibold text-stone-800">{c.label}</span>
            ) : (
              <Link href={c.href} className="text-fresh font-medium hover:underline">{c.label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
