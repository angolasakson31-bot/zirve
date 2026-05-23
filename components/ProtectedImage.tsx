'use client';
import { useState } from 'react';
import { addWatermark, pixelateUrl } from '@/lib/cloudinaryWatermark';

interface Props {
  src: string;
  alt: string;
  maxHeight?: number;
  dimmed?: boolean;
  blurPlaceholder?: string;
  pixelate?: boolean;
}

export default function ProtectedImage({ src, alt, maxHeight = 600, dimmed = false, blurPlaceholder, pixelate }: Props) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [failed, setFailed]       = useState(false);
  const [prevSrc, setPrevSrc]     = useState(src);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setImgLoaded(false);
    setUseFallback(false);
    setFailed(false);
  }

  const watermarkedSrc = useFallback ? src : addWatermark(src);
  const displaySrc     = pixelate ? pixelateUrl(src, 70) : watermarkedSrc;
  const handleError    = () => { if (!useFallback) setUseFallback(true); else setFailed(true); };
  const showSkel       = !imgLoaded && !failed;
  const skelH          = Math.min(maxHeight, 400);

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{ maxHeight }}
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
    >
      {/* Gizli img — yalnızca yükleme/hata takibi */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {pixelate ? (
        <img src={pixelateUrl(src, 70)} alt="" aria-hidden style={{ display: 'none' }}
          onLoad={() => setImgLoaded(true)} />
      ) : (
        <img src={watermarkedSrc} alt="" aria-hidden style={{ display: 'none' }}
          onLoad={() => setImgLoaded(true)} onError={handleError} />
      )}

      {failed && (
        <div
          className="w-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 text-xs gap-1"
          style={{ height: skelH }}
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
          <div
            className="w-full overflow-hidden"
            style={{
              height: skelH,
              backgroundImage: `url(${blurPlaceholder})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(16px)',
              transform: 'scale(1.15)',
            }}
          />
        ) : (
          <div className="w-full animate-pulse bg-zinc-800" style={{ height: skelH }} />
        )
      )}

      {imgLoaded && !failed && (
        <div
          role="img"
          aria-label={alt}
          style={{
            backgroundImage: `url(${displaySrc})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            width: '100%',
            height: skelH,
            opacity: dimmed ? 0.7 : 1,
            imageRendering: pixelate ? 'pixelated' : undefined,
          }}
        />
      )}

      <div className="absolute inset-0" style={{ zIndex: 10 }} onContextMenu={e => e.preventDefault()} />
    </div>
  );
}
