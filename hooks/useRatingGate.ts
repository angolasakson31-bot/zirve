'use client';
import { useState, useEffect } from 'react';
import { todayKey, getOwnPhotoIds, getDeviceToken } from '@/hooks/useUploadGate';

const SEEN_STORAGE_PREFIX = 'zirve_seen_';

function loadSeenIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SEEN_STORAGE_PREFIX + todayKey());
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// true  = tüm fotoğraflar oylandı (kapı açık)
// false = oylanacak fotoğraf var (kapı kapalı)
// null  = kontrol ediliyor
export function useRatingGate(): boolean | null {
  const [open, setOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const seenIds = loadSeenIds();
        const ownIds  = getOwnPhotoIds();
        const dt      = getDeviceToken();
        const exc     = [...new Set([...ownIds, ...seenIds])].slice(-1000).join(',');
        const p       = new URLSearchParams();
        if (exc) p.set('exclude', exc);
        if (dt)  p.set('dt', dt);
        const data = await fetch('/api/photos/has-new?' + p.toString()).then(r => r.json());
        setOpen(data.available === 0);
      } catch {
        setOpen(false);
      }
    };
    check();

    const onAllRated = () => setOpen(true);
    const onNewPhoto = () => setOpen(false);
    window.addEventListener('zirve:allRated', onAllRated);
    window.addEventListener('zirve:newPhotoArrived', onNewPhoto);
    return () => {
      window.removeEventListener('zirve:allRated', onAllRated);
      window.removeEventListener('zirve:newPhotoArrived', onNewPhoto);
    };
  }, []);

  return open;
}
