'use client';
import { useEffect, useState } from 'react';

export default function HeaderFlash() {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const handler = () => {
      setFlash(true);
      setTimeout(() => setFlash(false), 1500);
    };
    window.addEventListener('zirve:leaderChanged', handler);
    return () => window.removeEventListener('zirve:leaderChanged', handler);
  }, []);

  if (!flash) return null;

  return (
    <div className="absolute inset-0 pointer-events-none animate-pulse"
      style={{ boxShadow: 'inset 0 0 0 2px rgba(251,191,36,0.6)', borderRadius: 'inherit' }} />
  );
}
