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
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      // Diagonal watermark grid
      const step = Math.max(120, img.naturalWidth / 4);
      const fontSize = Math.max(13, img.naturalWidth / 20);
      ctx.save();
      ctx.globalAlpha = 0.13;
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.rotate(-Math.PI / 6);
      for (let y = -img.naturalHeight * 2; y < img.naturalHeight * 2; y += step)
        for (let x = -img.naturalWidth * 2; x < img.naturalWidth * 2; x += step)
          ctx.fillText('ZİRVE', x, y);
      ctx.restore();
    };
  }, [src]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-inherit select-none"
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

      {/* Tam resim — canvas ile filigranlanmış */}
      <div className="relative flex items-center justify-center" style={{ maxHeight }}>
        {!naturalSize && (
          <div className="w-full animate-pulse bg-zinc-800" style={{ height: Math.min(maxHeight, 400) }} />
        )}
        <canvas
          ref={canvasRef}
          aria-label={alt}
          className={`relative max-w-full object-contain ${dimmed ? 'opacity-80' : ''}`}
          style={{ maxHeight, display: naturalSize ? 'block' : 'none' }}
        />
      </div>

      {/* Tıklama/sürükleme engeli */}
      <div className="absolute inset-0" onContextMenu={e => e.preventDefault()} />
    </div>
  );
}
