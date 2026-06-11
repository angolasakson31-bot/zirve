'use client';
import { useEffect, useState } from 'react';
import { Cookie, X } from 'lucide-react';
import Link from 'next/link';
import { readConsent, writeConsent } from '@/lib/consent';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (readConsent() === null) setShow(true);
  }, []);

  if (!show) return null;

  const accept = () => {
    writeConsent(true);
    setShow(false);
  };

  const reject = () => {
    writeConsent(false);
    setShow(false);
  };

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-sm z-[150]">
      <div className="rounded-2xl border border-zinc-700 bg-zinc-900/95 backdrop-blur shadow-xl p-4 space-y-3">
        <div className="flex items-start gap-2">
          <div className="p-1 bg-amber-400/10 rounded-md flex-shrink-0">
            <Cookie className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-zinc-200 text-sm">Çerez Tercihleri</p>
            <p className="text-zinc-500 text-xs leading-relaxed mt-1">
              Platform, oturum yönetimi ve yaş doğrulama gibi <strong className="text-zinc-400">teknik çerezler</strong>{' '}
              kullanır. <strong className="text-zinc-400">Kabul ediyorum</strong>'a basarsanız ziyaretçi sayacı için
              anonim oturum kimliği de saklanır. Üçüncü taraf reklam veya analitik çerezi kullanılmaz.
              Detaylar için{' '}
              <Link href="/yasal" className="text-amber-500 hover:underline">Çerez Politikası</Link>'na bakabilirsiniz.
            </p>
          </div>
          <button onClick={reject} className="text-zinc-500 hover:text-white" aria-label="Kapat">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={reject}
            className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
          >
            Sadece zorunlu çerezler
          </button>
          <button
            onClick={accept}
            className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors"
          >
            Kabul ediyorum
          </button>
        </div>
      </div>
    </div>
  );
}
