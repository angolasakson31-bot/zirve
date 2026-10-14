'use client';
import { useEffect, useState } from 'react';
import { useViewerCode } from '@/hooks/useViewerCode';

const domain = process.env.NEXT_PUBLIC_SITE_DOMAIN ?? 'zirve-app-node.onrender.com';

function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// Kişiye özel filigran: fotoğrafı boydan boya kesen birkaç çapraz şerit.
// Az ama belirgin — biri ortadan geçtiği için kırpılarak silinemez.
// Ekran görüntüsündeki kod admin panelinden sorgulanabilir.
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
  // Şerit konumları (yüzde). Ortadaki %50'de Cloudinary'nin site adı var;
  // kod onun üstünden ve altından ikişer şeritle geçer. Küçük görsellerde tek şerit.
  const bands = dense ? [50] : [18, 34, 66, 82];

  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      style={{ zIndex: 5 }}
    >
      {bands.map(top => (
        <div
          key={top}
          className="absolute left-1/2 whitespace-nowrap font-bold"
          style={{
            top: `${top}%`,
            transform: 'translate(-50%, -50%) rotate(-25deg)',
            fontSize: dense ? 9 : 15,
            letterSpacing: '0.04em',
            color: 'rgba(255,255,255,0.42)',
            textShadow: '0 0 3px rgba(0,0,0,0.55)',
          }}
        >
          {Array.from({ length: 4 }, () => label).join('\u2003\u2003·\u2003\u2003')}
        </div>
      ))}
    </div>
  );
}
