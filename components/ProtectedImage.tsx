'use client';
import { useState, useRef, useEffect } from 'react';
import { addWatermark } from '@/lib/cloudinaryWatermark';
import { useUploadGate } from '@/hooks/useUploadGate';

interface Props {
  src: string;
  alt: string;
  maxHeight?: number;
  dimmed?: boolean;
}

export default function ProtectedImage({ src, alt, maxHeight = 600, dimmed = false }: Props) {
  const [loaded, setLoaded]       = useState(false);
  const [pixelReady, setPixelReady] = useState(false);
  const imgRef    = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uploaded  = useUploadGate();

  useEffect(() => {
    if (uploaded || !loaded) return;
    const img = imgRef.current;
    const cv  = canvasRef.current;
    if (!img || !cv) return;
    const w = Math.max(1, Math.floor(img.naturalWidth / 32));
    const h = Math.max(1, Math.floor(img.naturalHeight / 32));
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext('2d');
    if (ctx) { ctx.drawImage(img, 0, 0, w, h); setPixelReady(true); }
  }, [loaded, uploaded]);

  const showImg   = loaded && uploaded;
  const showPixel = loaded && !uploaded && pixelReady;
  const showSkel  = !showImg && !showPixel;

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{ maxHeight }}
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
    >
      {showSkel && (
        <div className="w-full animate-pulse bg-zinc-800" style={{ height: Math.min(maxHeight, 400) }} />
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={addWatermark(src)}
        alt={alt}
        className="w-full object-contain"
        style={{ maxHeight, display: showImg ? 'block' : 'none', opacity: dimmed ? 0.7 : 1 }}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        draggable={false}
      />

      {!uploaded && (
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            display: showPixel ? 'block' : 'none',
            imageRendering: 'pixelated',
            opacity: dimmed ? 0.7 : 1,
          }}
        />
      )}

      <div className="absolute inset-0" style={{ zIndex: 10 }} onContextMenu={e => e.preventDefault()} />
    </div>
  );
}
