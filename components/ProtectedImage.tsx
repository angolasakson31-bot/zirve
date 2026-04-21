'use client';
import { useEffect, useRef, useState } from 'react';

interface Props {
  src: string;
  alt: string;
  maxHeight?: number;
  dimmed?: boolean;
}

export default function ProtectedImage({ src, alt, maxHeight = 600, dimmed = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    setLoaded(false);
    setSize(null);
  }, [src]);

  const drawWatermark = (w: number, h: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = w;
    canvas.height = h;
    const step = Math.max(120, w / 4);
    const fontSize = Math.max(13, w / 20);
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.rotate(-Math.PI / 6);
    for (let y = -h * 2; y < h * 2; y += step)
      for (let x = -w * 2; x < w * 2; x += step)
        ctx.fillText('ZİRVE', x, y);
    ctx.restore();
  };

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{ maxHeight }}
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
    >
      {/* Bulanık arka plan */}
      <div
        aria-hidden
        className="absolute inset-0 scale-110"
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(18px) brightness(0.4)',
        }}
      />

      <div className="relative flex items-center justify-center" style={{ maxHeight }}>
        {!loaded && (
          <div className="w-full animate-pulse bg-zinc-800" style={{ height: Math.min(maxHeight, 400) }} />
        )}

        {/* Gerçek fotoğraf — img tag, CORS sorunu yok */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={`relative max-w-full object-contain ${dimmed ? 'opacity-80' : ''}`}
          style={{ maxHeight, display: loaded ? 'block' : 'none' }}
          onLoad={e => {
            const el = e.currentTarget;
            setLoaded(true);
            setSize({ w: el.naturalWidth, h: el.naturalHeight });
            drawWatermark(el.naturalWidth, el.naturalHeight);
          }}
          onError={() => setLoaded(true)}
          draggable={false}
        />

        {/* Filigran canvas — fotoğrafın üstünde, sadece metin çizer */}
        {size && (
          <canvas
            ref={canvasRef}
            aria-hidden
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ maxHeight }}
          />
        )}
      </div>

      {/* Tıklama/sürükleme engeli */}
      <div className="absolute inset-0" onContextMenu={e => e.preventDefault()} />
    </div>
  );
}
