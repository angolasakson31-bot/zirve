'use client';
import { useEffect, useRef, useState } from 'react';
import { hasTrackingConsent, CONSENT_EVENT } from '@/lib/consent';

// sessionStorage YERİNE localStorage — sekme kapansa, browser restart
// edilse bile aynı session ID kalır. Server tarafı zaten IP-bazlı dedup
// yapıyor (asıl koruma orada); sessionId sadece legacy compat için.
function getSessionId(): string {
  try {
    let id = localStorage.getItem('zirve_sid');
    if (!id) {
      const arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      id = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem('zirve_sid', id);
    }
    return id;
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

export default function VisitorCount() {
  const [count, setCount] = useState<number | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasPingedRef = useRef<boolean>(false);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/visitors');
        if (res.ok) {
          const data = await res.json();
          if (typeof data.count === 'number') setCount(data.count);
        }
      } catch {}
    };

    const ping = async () => {
      const sessionId = getSessionId();
      try {
        const res = await fetch('/api/visitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.count === 'number') setCount(data.count);
          hasPingedRef.current = true;
        }
      } catch {}
    };

    const startPing = () => {
      if (pingTimerRef.current) return;
      // İlk açılışta bir kez ping at — sonrası polling sürekli sayıyı tazeler.
      // Eski 60 sn ping interval'i kaldırıldı: server zaten IP-bazlı dedup
      // yapıyor, tekrarlı POST'ların pratik faydası yok (sayı değişmez,
      // sadece DB trafik üretir).
      if (!hasPingedRef.current) ping();
      pingTimerRef.current = setInterval(() => {
        // Gün değişince (00:00 sonrası) bir kez daha ping atalım ki yeni
        // günün sayısına dahil olalım. Aksi halde sadece poll'a güven.
        if (!hasPingedRef.current) ping();
      }, 10 * 60 * 1000); // 10 dk'da bir hâlâ ping atılmadıysa dene
    };
    const stopPing = () => {
      if (pingTimerRef.current) {
        clearInterval(pingTimerRef.current);
        pingTimerRef.current = null;
      }
    };

    // Sayı tazeleme her zaman çalışır — anonim count, KVKK kapsamı dışı.
    poll();
    const pollInterval = setInterval(poll, 10_000);

    // Ping (kayıt) yalnızca çerez onayı kabul edildiyse.
    if (hasTrackingConsent()) startPing();

    const handleConsent = (e: Event) => {
      const detail = (e as CustomEvent<{ accepted: boolean }>).detail;
      if (detail?.accepted) startPing();
      else stopPing();
    };
    window.addEventListener(CONSENT_EVENT, handleConsent);

    // Yeni gün başlarsa hasPinged'i sıfırla (gece yarısı tarayıcı açıksa).
    const dayResetInterval = setInterval(() => {
      const nowTrIso = new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);
      const last = (window as { __zirveVisitorPingDay?: string }).__zirveVisitorPingDay;
      if (last && last !== nowTrIso) hasPingedRef.current = false;
      (window as { __zirveVisitorPingDay?: string }).__zirveVisitorPingDay = nowTrIso;
    }, 60_000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(dayResetInterval);
      stopPing();
      window.removeEventListener(CONSENT_EVENT, handleConsent);
    };
  }, []);

  if (count === null) return null;

  return (
    <div className="flex items-center gap-1 px-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
      <span className="text-zinc-600 text-[10px]">Ziyaretçi</span>
      <span className="text-zinc-400 text-[10px] tabular-nums font-medium">{count}</span>
    </div>
  );
}
