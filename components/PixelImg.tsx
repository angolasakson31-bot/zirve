'use client';
import { useState, useRef, useEffect } from 'react';
import { useUploadGate } from '@/hooks/useUploadGate';

interface Props {
  src: string;
  alt: string;
  className?: string;
}

export default function PixelImg({ src, alt, className = 'w-full h-full object-cover' }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [ready,  setReady]  = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const cvRef  = useRef<HTMLCanvasElement>(null);
  const uploaded = useUploadGate();

  useEffect(() => {
    if (uploaded || !loaded) return;
    const img = imgRef.current;
    const cv  = cvRef.current;
    if (!img || !cv) return;
    // square center-crop at 1/10 resolution (object-cover behaviour)
    const size = 20;
    cv.width  = size;
    cv.height = size;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const { naturalWidth: iw, naturalHeight: ih } = img;
    const scale = size / Math.min(iw, ih);
    const sw = size / scale, sh = size / scale;
    const sx = (iw - sw) / 2,  sy = (ih - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
    setReady(true);
  }, [loaded, uploaded]);

  return (
    <div className="relative w-full h-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={className}
        style={{ display: uploaded && loaded ? 'block' : 'none' }}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        draggable={false}
      />
      <canvas
        ref={cvRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: !uploaded && ready ? 'block' : 'none', imageRendering: 'pixelated' }}
      />
      {(!loaded || (!uploaded && !ready)) && (
        <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
      )}
    </div>
  );
}
