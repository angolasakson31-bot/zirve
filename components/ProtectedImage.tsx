'use client';
import { useState, useEffect } from 'react';
import { addWatermark, pixelateUrl } from '@/lib/cloudinaryWatermark';
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
  const uploaded = useUploadGate(); // null | true | false

  useEffect(() => {
    setLoaded(false);
    setUseFallback(false);
    setFailed(false);
  }, [src, uploaded]);

  // uploaded=false → pikselleştirilmiş Cloudinary URL (canvas/CORS sorunu yok)
  // uploaded=null|true → watermarklı tam çözünürlük
  const isBlocked = uploaded === false;
  const imgSrc = isBlocked
    ? pixelateUrl(src)
    : (useFallback ? src : addWatermark(src));

  const handleError = () => {
    if (isBlocked) { setFailed(true); return; }
    if (!useFallback) { setUseFallback(true); } else { setFailed(true); }
  };

  const retry = () => {
    setFailed(false);
    setLoaded(false);
    setUseFallback(false);
    setRetryKey(k => k + 1);
  };

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{ maxHeight }}
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
    >
      {!loaded && !failed && (
        <div className="w-full animate-pulse bg-zinc-800" style={{ height: Math.min(maxHeight, 400) }} />
      )}

      {failed && (
        <div
          className="w-full flex flex-col items-center justify-center gap-2 bg-zinc-800/50 text-zinc-400"
          style={{ height: Math.min(maxHeight, 400) }}
        >
          <p className="text-xs">Fotoğraf yüklenemedi</p>
          <button
            onClick={retry}
            className="text-xs px-3 py-1 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-100"
          >
            Tekrar dene
          </button>
        </div>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={imgSrc + retryKey}
        src={imgSrc}
        alt={alt}
        className="w-full object-contain"
        style={{
          maxHeight,
          display: loaded && !failed ? 'block' : 'none',
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
