import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import './globals.css';
import MediaGuard from '@/components/MediaGuard';
import AgeGate from '@/components/AgeGate';
import { isMaintenanceOn } from '@/lib/maintenanceMode';

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';
  const skip = pathname.startsWith('/kapali') ||
               pathname.startsWith('/api/') ||
               pathname.startsWith('/admin') ||
               pathname.startsWith('/yasal');

  if (!skip && await isMaintenanceOn()) {
    redirect('/kapali');
  }

  return (
    <html lang="tr" className="h-full">
      <body className={`${inter.className} min-h-full bg-zinc-950 select-none`}>
        <AgeGate />
        <MediaGuard />
        {children}
      </body>
    </html>
  );
}
