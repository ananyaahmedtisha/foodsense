'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Leaf } from 'lucide-react';

// Shows /logo.png if the owner saved one in public/, else text logo.
export default function Logo() {
  const [imgOk, setImgOk] = useState(true);
  return (
    <Link href="/" className="flex items-center gap-2 font-display font-extrabold text-xl">
      {imgOk ? (
        <img src="/logo.png" alt="FoodSense" className="h-12 w-auto object-contain" onError={() => setImgOk(false)} />
      ) : (
        <>
          <span className="w-9 h-9 rounded-xl bg-fresh text-white grid place-items-center"><Leaf size={20} /></span>
          <span>Food<span className="text-fresh">Sense</span></span>
        </>
      )}
    </Link>
  );
}
