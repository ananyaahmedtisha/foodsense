'use client';
import { useState } from 'react';
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
  { href: '/calories', label: 'Calorie Counter' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b">
      <nav className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
        <span onClick={() => setOpen(false)}><Logo /></span>
        <div className="relative">
          <button
            className="p-2.5 rounded-lg hover:bg-cream"
            aria-label="All pages"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <Menu size={22} />
          </button>
          {open && (
            <>
              <button aria-label="Close menu" className="fixed inset-0 cursor-default" onClick={() => setOpen(false)} />
              <div className="absolute right-0 mt-2 w-52 bg-white border rounded-xl shadow-lift p-2 flex flex-col z-50">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="px-3 py-2.5 text-stone-700 hover:text-stone-900 hover:bg-fresh-light rounded-lg text-[15px]"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
