'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/',         label: 'Home' },
  { href: '/login',   label: 'Login' },
  { href: '/search',  label: 'Transactions' },
  { href: '/reviews', label: 'Reviews' },
];

export default function Navbar() {
  const path = usePathname();
  return (
    <nav className="sticky top-0 z-50 border-b border-[#1a2744] bg-[#0d1526]/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white">
          <span className="text-2xl">🏦</span>
          <span className="text-blue-400">Vault</span>Bank
        </Link>

        <div className="flex items-center gap-1">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                path === l.href
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-green-400 pulse-dot inline-block" />
          Protected by CyberShield
        </div>
      </div>
    </nav>
  );
}
