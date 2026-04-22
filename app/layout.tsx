import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VaultBank — Secure Online Banking',
  description: 'Your trusted digital banking platform, protected by CyberShield WAF.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <footer className="border-t border-[#1a2744] py-6 text-center text-xs text-gray-600">
          © 2025 VaultBank Inc. · All transactions secured by 256-bit TLS · Protected by CyberShield WAF
        </footer>
      </body>
    </html>
  );
}
