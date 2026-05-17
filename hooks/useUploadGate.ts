'use client';
import { useState, useEffect } from 'react';

const UPLOAD_KEY = 'zirve_uploaded_date';
const UPLOAD_EVENT = 'zirve_uploaded_change';
const VOTE_KEY = 'zirve_voted_date';
const VOTE_EVENT = 'zirve_voted_change';

function todayStr() {
  const TZ_OFFSET_MS = 3 * 60 * 60 * 1000;
  return new Date(Date.now() + TZ_OFFSET_MS).toISOString().slice(0, 10);
}

export function markUploaded() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(UPLOAD_KEY, todayStr());
    window.dispatchEvent(new Event(UPLOAD_EVENT));
  } catch {}
}

// null = henüz kontrol edilmedi (SSR veya ilk render)
// true = bugün fotoğraf yüklendi
// false = yüklenmedi
export function useUploadGate(): boolean | null {
  const [uploaded, setUploaded] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => {
      try {
        setUploaded(localStorage.getItem(UPLOAD_KEY) === todayStr());
      } catch {
        setUploaded(false);
      }
    };
    check();
    window.addEventListener(UPLOAD_EVENT, check);
    window.addEventListener('storage', check);
    return () => {
      window.removeEventListener(UPLOAD_EVENT, check);
      window.removeEventListener('storage', check);
    };
  }, []);

  return uploaded;
}

export function markVoted() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VOTE_KEY, todayStr());
    window.dispatchEvent(new Event(VOTE_EVENT));
  } catch {}
}

export function useVoteGate(): boolean | null {
  const [voted, setVoted] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => {
      try {
        setVoted(localStorage.getItem(VOTE_KEY) === todayStr());
      } catch {
        setVoted(false);
      }
    };
    check();
    window.addEventListener(VOTE_EVENT, check);
    window.addEventListener('storage', check);
    return () => {
      window.removeEventListener(VOTE_EVENT, check);
      window.removeEventListener('storage', check);
    };
  }, []);

  return voted;
}

export function todayKey() {
  return todayStr();
}
