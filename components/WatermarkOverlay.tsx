'use client';
import { useEffect, useState } from 'react';
import { useViewerCode } from '@/hooks/useViewerCode';

function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// Kişiye özel filigran: ziyaretçinin kodu + saat. Ekran görüntüsündeki kod
// admin panelinden sorgulanabilir.
export default function WatermarkOverlay({ dense = false }: { dense?: boolean }) {
  const code = useViewerCode();
  const [time, setTime] = useState('');

  useEffect(() => {
    setTime(stamp());
    const t = setInterval(() => setTime(stamp()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!code) return null;
  const label = `${code} · ${time}`;
  // Ortada (%50) Cloudinary'nin bastığı site adı var. Kod, ona paralel olarak
  // üstünden ve altından geçen kısa, tam okunur iki etiket. Yazı boyutu
  // fotoğraf genişliğine göre ölçeklenir (cqw) — hiçbir fotoğrafta kesilmez.
  const bands = dense ? [78] : [28, 72];

  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      style={{ zIndex: 5, containerType: 'size' }}
    >
      {bands.map(top => (
        <div
          key={top}
          className="absolute left-1/2 whitespace-nowrap font-bold"
          style={{
            top: `${top}%`,
            transform: 'translate(-50%, -50%) rotate(-25deg)',
            fontSize: dense ? 'max(8px, 7cqw)' : 'max(11px, 4.6cqw)',
            letterSpacing: '0.06em',
            color: 'rgba(255,255,255,0.5)',
            textShadow: '0 0 3px rgba(0,0,0,0.6)',
          }}
        >
          {label}
        </div>
      ))}
    </div>
  );
}
