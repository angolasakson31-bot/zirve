'use client';
import { useState, useEffect } from 'react';

const UPLOAD_KEY = 'zirve_uploaded_date';
const UPLOAD_EVENT = 'zirve_uploaded_change';
const VOTE_KEY = 'zirve_voted_date';
const VOTE_EVENT = 'zirve_voted_change';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function markUploaded() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(UPLOAD_KEY, todayStr());
  window.dispatchEvent(new Event(UPLOAD_EVENT));
}

export function useUploadGate(): boolean {
  const [uploaded, setUploaded] = useState(false);

  useEffect(() => {
    const check = () => setUploaded(localStorage.getItem(UPLOAD_KEY) === todayStr());
    check();
    window.addEventListener(UPLOAD_EVENT, check);
    return () => window.removeEventListener(UPLOAD_EVENT, check);
  }, []);

  return uploaded;
}

export function markVoted() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VOTE_KEY, todayStr());
  window.dispatchEvent(new Event(VOTE_EVENT));
}

export function useVoteGate(): boolean {
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    const check = () => setVoted(localStorage.getItem(VOTE_KEY) === todayStr());
    check();
    window.addEventListener(VOTE_EVENT, check);
    return () => window.removeEventListener(VOTE_EVENT, check);
  }, []);

  return voted;
}

export function todayKey() {
  return todayStr();
}
