'use client';
import { useState } from 'react';
import { addWatermark, pixelateUrl } from '@/lib/cloudinaryWatermark';
import { useUploadGate } from '@/hooks/useUploadGate';

interface Props {
  src: string;
  alt: string;
  maxHeight?: number;
  dimmed?: boolean;
  blurPlaceholder?: string;
}

export default function ProtectedImage({ src, alt, maxHeight = 600, dimmed = false, blurPlaceholder }: Props) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [failed, setFailed]       = useState(false);
  const [prevSrc, setPrevSrc]     = useState(src);
  const uploaded = useUploadGate();

  // Derived state reset — no useEffect race condition
  if (src !== prevSrc) {
    setPrevSrc(src);
    setImgLoaded(false);
    setUseFallback(false);
    setFailed(false);
  }

  const fullSrc    = useFallback ? src : addWatermark(src);
  const handleError = () => { if (!useFallback) setUseFallback(true); else setFailed(true); };
  const showSkel   = !imgLoaded && !failed;

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{ maxHeight }}
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
    >
      {failed && (
        <div
          className="w-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 text-xs gap-1"
          style={{ height: Math.min(maxHeight, 400) }}
        >
          <span>Fotoğraf yüklenemedi</span>
          <button
            className="text-amber-500 hover:underline"
            onClick={() => { setFailed(false); setUseFallback(false); setImgLoaded(false); }}
          >
            Tekrar dene
          </button>
        </div>
      )}

      {showSkel && (
        blurPlaceholder ? (
          <div className="relative w-full overflow-hidden" style={{ height: Math.min(maxHeight, 400) }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={blurPlaceholder} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'blur(16px)', transform: 'scale(1.15)' }} />
          </div>
        ) : (
          <div className="w-full animate-pulse bg-zinc-800" style={{ height: Math.min(maxHeight, 400) }} />
        )
      )}

      {uploaded === true && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={fullSrc}
          alt={alt}
          className="w-full object-contain"
          style={{ maxHeight, display: imgLoaded ? 'block' : 'none', opacity: dimmed ? 0.7 : 1 }}
          onLoad={() => setImgLoaded(true)}
          onError={handleError}
          draggable={false}
        />
      )}

      {uploaded === false && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={pixelateUrl(src, 37)}
          alt={alt}
          className="w-full object-contain"
          style={{ maxHeight, display: imgLoaded ? 'block' : 'none', imageRendering: 'pixelated', opacity: dimmed ? 0.7 : 1 }}
          onLoad={() => setImgLoaded(true)}
          draggable={false}
        />
      )}

      <div className="absolute inset-0" style={{ zIndex: 10 }} onContextMenu={e => e.preventDefault()} />
    </div>
  );
}
