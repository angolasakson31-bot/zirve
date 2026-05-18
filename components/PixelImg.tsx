'use client';
import { useState, useRef, useEffect } from 'react';
import { useUploadGate } from '@/hooks/useUploadGate';

interface Props {
  src: string;
  alt: string;
  className?: string;
  lazy?: boolean;
}

export default function PixelImg({ src, alt, className = 'w-full h-full object-cover', lazy = true }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [ready,  setReady]  = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const cvRef  = useRef<HTMLCanvasElement>(null);
  const uploaded = useUploadGate(); // null | true | false

  useEffect(() => {
    if (uploaded !== false || !loaded) return;
    const img = imgRef.current;
    const cv  = cvRef.current;
    if (!img || !cv) return;
    const size = 20;
    cv.width  = size;
    cv.height = size;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const { naturalWidth: iw, naturalHeight: ih } = img;
    if (!iw || !ih) return;
    const scale = size / Math.min(iw, ih);
    const sw = size / scale, sh = size / scale;
    const sx = (iw - sw) / 2,  sy = (ih - sh) / 2;
    try { ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size); setReady(true); } catch {}
  }, [loaded, uploaded]);

  const showImg   = loaded && uploaded !== false;
  const showPixel = loaded && uploaded === false && ready;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={className}
        style={{ display: showImg ? 'block' : 'none' }}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        draggable={false}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
      />
      <canvas
        ref={cvRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: showPixel ? 'block' : 'none', imageRendering: 'pixelated' }}
      />
      {!loaded && !showPixel && (
        <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
      )}
    </div>
  );
}
