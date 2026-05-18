'use client';
import { useState, useEffect } from 'react';
import { addWatermark } from '@/lib/cloudinaryWatermark';
import { useUploadGate } from '@/hooks/useUploadGate';

interface Props {
  src: string;
  alt: string;
  maxHeight?: number;
  dimmed?: boolean;
  priority?: boolean;
}

export default function ProtectedImage({ src, alt, maxHeight = 600, dimmed = false, priority = false }: Props) {
  const [loaded, setLoaded]           = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [failed, setFailed]           = useState(false);
  const [retryKey, setRetryKey]       = useState(0);
  const uploaded = useUploadGate();

  const isBlocked = uploaded !== true;
  // Engelli modda Cloudinary transform KULLANMA — transform hatası HTTP 200 + siyah
  // resim döndürüyor, onError tetiklenmiyor. Orijinal URL + CSS pikselasyon her zaman çalışır.
  const imgSrc = isBlocked
    ? src
    : (useFallback ? src : addWatermark(src));

  useEffect(() => {
    setLoaded(false);
    setUseFallback(false);
    setFailed(false);
  }, [src]);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [imgSrc]);

  const handleError = () => {
    if (!useFallback && !isBlocked) { setUseFallback(true); }
    else { setFailed(true); }
  };

  const retry = () => {
    setFailed(false);
    setLoaded(false);
    setUseFallback(false);
    setRetryKey(k => k + 1);
  };

  const blockHeight = Math.min(maxHeight, 400);

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{ maxHeight, height: isBlocked ? blockHeight : undefined }}
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
    >
      {!loaded && !failed && (
        <div className="w-full animate-pulse bg-zinc-800" style={{ height: blockHeight }} />
      )}

      {failed && (
        <div
          className="w-full flex flex-col items-center justify-center gap-2 bg-zinc-800/50 text-zinc-400"
          style={{ height: blockHeight }}
        >
          <p className="text-xs">Fotoğraf yüklenemedi</p>
          <button onClick={retry} className="text-xs px-3 py-1 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-100">
            Tekrar dene
          </button>
        </div>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={imgSrc + retryKey}
        src={imgSrc}
        alt={alt}
        style={isBlocked ? {
          display: loaded && !failed ? 'block' : 'none',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '20%',
          height: '20%',
          objectFit: 'cover',
          imageRendering: 'pixelated',
          transform: 'scale(5)',
          transformOrigin: '0 0',
          opacity: dimmed ? 0.7 : 1,
        } : {
          maxHeight,
          display: loaded && !failed ? 'block' : 'none',
          width: '100%',
          objectFit: 'contain',
          opacity: dimmed ? 0.7 : 1,
        }}
        onLoad={() => setLoaded(true)}
        onError={handleError}
        draggable={false}
        // @ts-expect-error fetchpriority is a valid HTML attribute
        fetchpriority={priority ? 'high' : 'auto'}
      />

      <div className="absolute inset-0" style={{ zIndex: 10 }} onContextMenu={e => e.preventDefault()} />
    </div>
  );
}
