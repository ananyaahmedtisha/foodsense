'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { adminSignOut } from './AdminLogout';

const LIMIT_MS = 30 * 60 * 1000; // 30 minutes idle → auto logout

export default function AdminAutoLogout() {
  const router = useRouter();
  const timer = useRef(null);

  useEffect(() => {
    function reset() {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => adminSignOut(router), LIMIT_MS);
    }
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (timer.current) clearTimeout(timer.current);
    };
  }, [router]);

  return null;
}
