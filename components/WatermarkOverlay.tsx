'use client';
import { useEffect, useRef, useState } from 'react';
import { useViewerCode } from '@/hooks/useViewerCode';

const domain = process.env.NEXT_PUBLIC_SITE_DOMAIN ?? 'zirve-app-node.onrender.com';

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
  const boxRef = useRef<HTMLDivElement>(null);
  // Kutunun yüksekliği, genişliğin yüzdesi olarak (= cqw cinsinden yükseklik)
  const [heightCqw, setHeightCqw] = useState<number | null>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0) setHeightCqw((height / width) * 100);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [code]);

  useEffect(() => {
    setTime(stamp());
    const t = setInterval(() => setTime(stamp()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!code) return null;
  const label = `${code} · ${time}`;
  // Ortada Cloudinary'nin bastığı site adı var. Üstünde ve altında, ona
  // paralel olarak sırayla kod ve site adı satırları. Aralık fotoğraf
  // genişliğine göre (cqw) sabit: uzun fotoğrafa daha çok satır sığar,
  // kısa fotoğrafta fazlası dışarıda kalır — satırlar üst üste binmez.
  const lines: { offset: number; text: string; site: boolean }[] = dense
    ? [{ offset: 28, text: label, site: false }]
    : [13, 26, 39, 52].flatMap((d, i) => {
        const site = i % 2 === 1;
        const text = site ? domain : label;
        return [{ offset: -d, text, site }, { offset: d, text, site }];
      })
      // Sadece tamamen sığan satırlar — kenarda yarım yazı kalmasın.
      // Eğik satırın dikey yarı-yüksekliği yaklaşık: kod ~12cqw, site adı ~15cqw.
      .filter(l => heightCqw === null || Math.abs(l.offset) + (l.site ? 15 : 12) <= heightCqw / 2);

  return (
    <div
      ref={boxRef}
      aria-hidden
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      style={{ zIndex: 5, containerType: 'size' }}
    >
      {lines.map(l => (
        <div
          key={l.offset}
          className="absolute left-1/2 whitespace-nowrap font-bold"
          style={{
            top: `calc(50% + ${l.offset}cqw)`,
            transform: 'translate(-50%, -50%) rotate(-25deg)',
            fontSize: dense ? 'max(8px, 7cqw)' : 'max(10px, 3.8cqw)',
            letterSpacing: '0.06em',
            color: l.site ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.45)',
            textShadow: '0 0 3px rgba(0,0,0,0.55)',
          }}
        >
          {l.text}
        </div>
      ))}
    </div>
  );
}
