'use client';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

export async function adminSignOut(router) {
  try {
    const sb = createClient();
    if (sb) await sb.auth.signOut();
  } catch {}
  router.push('/admin/login');
  router.refresh();
}

export default function AdminLogout() {
  const router = useRouter();
  return (
    <button
      onClick={() => adminSignOut(router)}
      className="px-4 py-2 rounded-full border text-sm font-semibold hover:bg-red-50 text-red-600 flex items-center gap-1.5"
    >
      <LogOut size={15} /> Log out
    </button>
  );
}
