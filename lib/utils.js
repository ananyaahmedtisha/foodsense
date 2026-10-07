import Link from 'next/link';

export function cn(...parts) {
  return parts.filter(Boolean).join(' ');
}
