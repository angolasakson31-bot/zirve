'use client';
import { useState, useEffect } from 'react';

const KEY = 'zirve_uploaded_date';
const EVENT = 'zirve_uploaded_change';

function todayStr() {
  return new Date().toISOString().slice(0, 10); // "2026-04-20"
}

export function markUploaded() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, todayStr());
  window.dispatchEvent(new Event(EVENT));
}

export function useUploadGate(): boolean {
  const [uploaded, setUploaded] = useState(false);

  useEffect(() => {
    const check = () => setUploaded(localStorage.getItem(KEY) === todayStr());
    check();
    window.addEventListener(EVENT, check);
    return () => window.removeEventListener(EVENT, check);
  }, []);

  return uploaded;
}
