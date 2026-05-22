'use client';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    const sessionId = getSessionId();

    const ping = async () => {
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

    ping();
    const interval = setInterval(ping, 60_000); // her dakika ping
    return () => clearInterval(interval);
  }, []);

  if (count === null) return null;

  return (
    <div className="flex items-center gap-1.5 bg-zinc-800/60 rounded-full px-2.5 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
      <span className="text-zinc-500 text-xs">Ziyaretçi</span>
      <span className="text-zinc-300 text-xs tabular-nums font-medium">{count}</span>
    </div>
  );
}
