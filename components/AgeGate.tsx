'use client';
import { useEffect, useState } from 'react';
import { Mountain, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

const AGE_KEY = 'zirve_age_ok';

export default function AgeGate() {
  const [confirmed, setConfirmed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setConfirmed(localStorage.getItem(AGE_KEY) === '1');
    } catch {
      setConfirmed(false);
    }
  }, []);

  if (confirmed !== false) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-sm w-full rounded-2xl border border-zinc-700 bg-zinc-900 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-400/10 rounded-lg">
            <Mountain className="w-5 h-5 text-amber-400" />
          </div>
          <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            ZİRVE X
          </span>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-amber-300 text-sm leading-snug font-medium">
            Bu platform <strong>yalnızca 18 yaş ve üzeri</strong> kullanıcılara yöneliktir.
            Yetişkin içerik barındırmaktadır.
          </p>
        </div>

        <p className="text-zinc-400 text-sm leading-relaxed">
          Devam etmek için 18 yaşında veya daha büyük olduğunuzu onaylamanız gerekmektedir.
          18 yaşının altındaysanız lütfen siteyi kapatın.
        </p>

        <button
          className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-bold py-3 rounded-xl text-sm transition-colors"
          onClick={() => {
            try { localStorage.setItem(AGE_KEY, '1'); } catch {}
            setConfirmed(true);
          }}
        >
          18 Yaşında veya Üzerindeyim — Devam Et
        </button>

        <p className="text-zinc-600 text-xs text-center leading-relaxed">
          Devam ederek{' '}
          <Link href="/yasal" className="text-amber-500 hover:underline">
            kullanım koşullarını
          </Link>{' '}
          okuduğunuzu ve kabul ettiğinizi beyan etmiş olursunuz.
        </p>
      </div>
    </div>
  );
}
