import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import MediaGuard from '@/components/MediaGuard';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#09090b',
};

export const metadata: Metadata = {
  title: 'Zirve X — Zirveye Çık, X Ol',
  description: 'Fotoğrafını yükle, puanlan, zirveye çık. Sana ulaşsınlar.',
  robots: { index: false, follow: false, nocache: true },
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Zirve X' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="h-full">
      <body className={`${inter.className} min-h-full bg-zinc-950 select-none`}>
        <MediaGuard />
        {children}
      </body>
    </html>
  );
}
