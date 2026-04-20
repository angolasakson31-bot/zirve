import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Zirve — Körlemesine Puan Ver',
  description: 'Fotoğrafları körlemesine puan ver, zirveyi belirle.',
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="h-full">
      <body className={`${inter.className} min-h-full bg-zinc-950`}>{children}</body>
    </html>
  );
}
