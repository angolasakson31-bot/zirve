'use client';
import { useEffect, useRef, useState } from 'react';
import { hasTrackingConsent, CONSENT_EVENT } from '@/lib/consent';

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem('zirve_sid');
    if (!id) {
      const arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      id = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
      sessionStorage.setItem('zirve_sid', id);
    }
    return id;
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

export default function VisitorCount() {
  const [count, setCount] = useState<number | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        }
      } catch {}
    };

    const startPing = () => {
      if (pingTimerRef.current) return;
      ping();
      pingTimerRef.current = setInterval(ping, 60_000);
    };
    const stopPing = () => {
      if (pingTimerRef.current) {
        clearInterval(pingTimerRef.current);
        pingTimerRef.current = null;
      }
    };

    // Sayı tazeleme her zaman çalışır — anonim, KVKK kapsamı dışı.
    poll();
    const pollInterval = setInterval(poll, 10_000);

    // Ping (oturum kimliği kaydı) yalnızca çerez onayı kabul edildiyse.
    if (hasTrackingConsent()) startPing();

    const handleConsent = (e: Event) => {
      const detail = (e as CustomEvent<{ accepted: boolean }>).detail;
      if (detail?.accepted) startPing();
      else stopPing();
    };
    window.addEventListener(CONSENT_EVENT, handleConsent);

    return () => {
      clearInterval(pollInterval);
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
