'use client';
import { useEffect, useState } from 'react';
import { Mountain, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

const LS_KEY      = 'zirve_age_ok';
const COOKIE_NAME = 'zirve_age';
const SYNC_KEY    = 'zirve_age_synced_v1';
const ONE_YEAR    = 365 * 24 * 60 * 60;
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 1 gün

function readConfirmed(): boolean {
  try {
    if (localStorage.getItem(LS_KEY) === '1') return true;
  } catch {}
  try {
    if (document.cookie.split(';').some(c => c.trim().startsWith(COOKIE_NAME + '=1'))) return true;
  } catch {}
  return false;
}

async function writeConfirmed() {
  try { localStorage.setItem(LS_KEY, '1'); } catch {}
  try {
    const exp = new Date(Date.now() + ONE_YEAR * 1000).toUTCString();
    const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${COOKIE_NAME}=1; expires=${exp}; path=/; SameSite=Lax${secure}`;
  } catch {}
  // Sunucu zorlamalı yaş kapısı: HMAC imzalı HttpOnly cookie yazdır
  try {
    const res = await fetch('/api/age/confirm', { method: 'POST' });
    if (res.ok) {
      try { localStorage.setItem(SYNC_KEY, String(Date.now())); } catch {}
    }
  } catch {}
}

// Daha önce onay verip de henüz sunucu cookie'si almamış kullanıcılar için
// (middleware zorlaması bu özellikten önce gelen kullanıcıları kilitler).
// İlk sync'de sayfayı bir kez yeniler; sonrası sessiz.
async function ensureServerCookie() {
  let lastSync = 0;
  try { lastSync = parseInt(localStorage.getItem(SYNC_KEY) ?? '0', 10) || 0; } catch {}
  if (lastSync && Date.now() - lastSync < SYNC_INTERVAL_MS) return;
  try {
    const res = await fetch('/api/age/confirm', { method: 'POST' });
    if (!res.ok) return;
    try { localStorage.setItem(SYNC_KEY, String(Date.now())); } catch {}
    // Eğer bu ilk sync ise (eski kullanıcı), cookie yeni geldi — içerik
    // fetchlerinin tekrar denenmesi için sayfayı yenile.
    if (!lastSync) {
      window.location.reload();
    }
  } catch {}
}

export default function AgeGate() {
  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const c = readConfirmed();
    setConfirmed(c);
    // Daha önce onay vermiş ama sunucu cookie'si olmayan kullanıcılar için
    // arka planda backfill yap (middleware 403'lerini önler).
    if (c) ensureServerCookie();
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
          </p>
        </div>

        <p className="text-zinc-400 text-sm leading-relaxed">
          Devam etmek için 18 yaşında veya daha büyük olduğunuzu onaylamanız gerekmektedir.
          18 yaşının altındaysanız lütfen siteyi kapatın.
        </p>

        <button
          disabled={submitting}
          className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={async () => {
            setSubmitting(true);
            await writeConfirmed();
            // Sunucu cookie'sinin aktif olması için içerik fetchlerini sıfırdan başlat.
            window.location.reload();
          }}
        >
          {submitting ? 'Doğrulanıyor…' : '18 Yaşında veya Üzerindeyim — Devam Et'}
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
