import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import MediaGuard from '@/components/MediaGuard';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Zirve Namus — Namusunuzu Zirveye Taşıyın',
  description: 'Namusunuzu zirveye taşıtın. Fotoğrafını yükle, puanlandır, size ulaşsınlar.',
  robots: { index: false, follow: false, nocache: true },
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
