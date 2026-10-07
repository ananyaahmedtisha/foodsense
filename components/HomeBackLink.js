'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function HomeBackLink() {
  const path = usePathname();
  if (path === '/') return null;
  return (
    <div className="pt-4">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-fresh hover:underline">
        <ArrowLeft size={15} /> Home
      </Link>
    </div>
  );
}
