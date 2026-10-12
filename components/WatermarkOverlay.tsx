'use client';
import { useEffect, useState } from 'react';
import { useViewerCode } from '@/hooks/useViewerCode';

const domain = process.env.NEXT_PUBLIC_SITE_DOMAIN ?? 'zirve-app-node.onrender.com';

function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// Fotoğrafın üzerine kişiye özel, döşenmiş filigran. Ekran görüntüsüne de
// girer; sızan görüntüdeki kod admin panelinden sorgulanabilir.
export default function WatermarkOverlay({ dense = false }: { dense?: boolean }) {
  const code = useViewerCode();
  const [time, setTime] = useState('');

  useEffect(() => {
    setTime(stamp());
    const t = setInterval(() => setTime(stamp()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!code) return null;
  const label = `${domain} · ${code} · ${time}`;
  const rows = dense ? 3 : 8;

  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      style={{ zIndex: 5 }}
    >
      <div
        className="absolute flex flex-col justify-around"
        style={{ inset: '-50%', transform: 'rotate(-25deg)' }}
      >
        {Array.from({ length: rows * 2 }, (_, i) => (
          <div
            key={i}
            className="whitespace-nowrap font-bold"
            style={{
              fontSize: dense ? 9 : 13,
              color: 'rgba(255,255,255,0.22)',
              textShadow: '0 0 2px rgba(0,0,0,0.35)',
              marginLeft: i % 2 ? '-6em' : 0,
            }}
          >
            {`${label}     `.repeat(6)}
          </div>
        ))}
      </div>
    </div>
  );
}
