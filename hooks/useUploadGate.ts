'use client';
import { useState, useEffect } from 'react';

const KEY = 'zirve_uploaded';
const EVENT = 'zirve_uploaded_change';

export function markUploaded() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, '1');
  window.dispatchEvent(new Event(EVENT));
}

export function useUploadGate(): boolean {
  const [uploaded, setUploaded] = useState(false);

  useEffect(() => {
    const check = () => setUploaded(!!localStorage.getItem(KEY));
    check();
    window.addEventListener(EVENT, check);
    return () => window.removeEventListener(EVENT, check);
  }, []);

  return uploaded;
}
