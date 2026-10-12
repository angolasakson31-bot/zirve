'use client';
import { useEffect, useState } from 'react';

// Tüm fotoğraflar aynı kodu kullanır — sayfa başına tek istek.
let cached: string | null = null;
let pending: Promise<string | null> | null = null;

function load(): Promise<string | null> {
  if (!pending) {
    pending = fetch('/api/viewer-code')
      .then(r => (r.ok ? r.json() : { code: null }))
      .then(d => { cached = typeof d?.code === 'string' ? d.code : null; return cached; })
      .catch(() => { pending = null; return null; });
  }
  return pending;
}

export function useViewerCode(): string | null {
  const [code, setCode] = useState<string | null>(cached);
  useEffect(() => {
    if (cached) return;
    let alive = true;
    load().then(c => { if (alive) setCode(c); });
    return () => { alive = false; };
  }, []);
  return code;
}
