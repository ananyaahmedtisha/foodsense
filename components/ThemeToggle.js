'use client';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('foodsense-theme');
      const isDark = saved ? saved === 'dark' : window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      setDark(!!isDark);
      document.documentElement.classList.toggle('dark', !!isDark);
    } catch {}
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('foodsense-theme', next ? 'dark' : 'light'); } catch {}
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="p-2.5 rounded-full border hover:bg-cream dark:hover:bg-stone-800 transition"
    >
      {dark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
