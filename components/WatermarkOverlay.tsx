'use client';
import { useEffect, useRef, useState } from 'react';
import { useViewerCode } from '@/hooks/useViewerCode';

const domain = process.env.NEXT_PUBLIC_SITE_DOMAIN ?? 'zirve-app-node.onrender.com';

function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

type Stamp = { x: number; y: number; text: string; site: boolean; font: number };

const COS = Math.cos((25 * Math.PI) / 180);
const SIN = Math.sin((25 * Math.PI) / 180);

// Etiketleri -25° eğik bir "tuğla" ızgarasına dağıtır: satırlar dönüşümlü
// kaydırılır, ortadaki satır Cloudinary'nin site adına ayrılır. Yalnızca
// fotoğrafa tamamen sığan etiketler döner — kenarda yarım yazı kalmaz.
// Tüm ölçüler piksel; (x, y) kutunun merkezine göre.
function layoutStamps(w: number, h: number, label: string, site: string): Stamp[] {
  const font = Math.max(9, w * 0.034);
  const charW = font * 0.64;
  const rowGap = font * 5;
  const out: Stamp[] = [];
  const rows = Math.ceil(Math.hypot(w, h) / 2 / rowGap) + 1;
  const fits = (x: number, y: number, len: number) => {
    const hx = (len / 2) * COS + (font / 2) * SIN;
    const hy = (len / 2) * SIN + (font / 2) * COS;
    return Math.abs(x) + hx <= w / 2 - 4 && Math.abs(y) + hy <= h / 2 - 4;
  };
  const codeLen = label.length * charW;
  const siteLen = site.length * charW;
  for (let r = -rows; r <= rows; r++) {
    if (r === 0) continue; // ortada Cloudinary'nin site adı var
    const siteRow = r % 2 === 0;
    const colGap = (siteRow ? siteLen : codeLen) + font * 6;
    const shift = Math.abs(r) % 4 < 2 ? 0 : colGap / 2;
    const cols = Math.ceil(Math.hypot(w, h) / 2 / colGap) + 1;
    const v = r * rowGap;
    for (let c = -cols; c <= cols; c++) {
      const u = c * colGap + shift;
      // Eğik çerçeveden ekrana: rotate(-25deg)
      const x = u * COS + v * SIN;
      const y = -u * SIN + v * COS;
      // Site adı sığmıyorsa aynı yere daha kısa olan kodu koy
      if (siteRow && fits(x, y, siteLen)) out.push({ x, y, text: site, site: true, font });
      else if (fits(x, y, codeLen)) out.push({ x, y, text: label, site: false, font });
    }
  }
  return out;
}

// Kişiye özel filigran: ziyaretçinin kodu + saat ve site adı, fotoğrafa
// dağınık yerleşir. Ekran görüntüsündeki kod admin panelinden sorgulanabilir.
export default function WatermarkOverlay({ dense = false }: { dense?: boolean }) {
  const code = useViewerCode();
  const [time, setTime] = useState('');
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ w: Math.round(width), h: Math.round(height) });
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
  const stamps: Stamp[] = !size
    ? []
    : dense
      ? [{ x: 0, y: size.h * 0.28, text: label, site: false, font: Math.max(8, size.w * 0.07) }]
      : layoutStamps(size.w, size.h, label, domain);

  return (
    <div
      ref={boxRef}
      aria-hidden
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      style={{ zIndex: 5 }}
    >
      {stamps.map(s => (
        <div
          key={`${Math.round(s.x)}:${Math.round(s.y)}`}
          className="absolute whitespace-nowrap font-bold"
          style={{
            left: `calc(50% + ${s.x}px)`,
            top: `calc(50% + ${s.y}px)`,
            transform: 'translate(-50%, -50%) rotate(-25deg)',
            fontSize: s.font,
            letterSpacing: '0.04em',
            color: s.site ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.45)',
            textShadow: '0 0 3px rgba(0,0,0,0.55)',
          }}
        >
          {s.text}
        </div>
      ))}
    </div>
  );
}
