'use client';

const KEY = 'zirve_my_uploads';
const MAX_TRACKED = 100;

export function getMyUploads(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(x => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function addMyUpload(photoId: string) {
  if (typeof window === 'undefined' || !photoId) return;
  try {
    const ids = getMyUploads();
    if (ids.includes(photoId)) return;
    ids.unshift(photoId);
    const trimmed = ids.slice(0, MAX_TRACKED);
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {}
}
