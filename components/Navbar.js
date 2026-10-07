import Link from 'next/link';
import { Menu } from 'lucide-react';
import Logo from './Logo';

const links = [
  { href: '/', label: 'Home' },
  { href: '/articles', label: 'Science Pantry' },
  { href: '/posters', label: 'Awareness Gallery' },
  { href: '/videos', label: 'Visual Learning' },
  { href: '/surveys', label: 'Campus Pulse' },
  { href: '/play', label: 'Play & Learn' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b">
      <nav className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
        <Logo />
        <details className="relative">
          <summary className="list-none cursor-pointer p-2.5 rounded-lg hover:bg-cream" aria-label="All pages">
            <Menu size={22} />
          </summary>
          <div className="absolute right-0 mt-2 w-52 bg-white border rounded-xl shadow-lift p-2 flex flex-col">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="px-3 py-2.5 text-stone-700 hover:text-stone-900 text-[15px]">{l.label}</Link>
            ))}
          </div>
        </details>
      </nav>
    </header>
  );
}
