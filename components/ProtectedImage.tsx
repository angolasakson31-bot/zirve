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

  if (src !== prevSrc) {
    setPrevSrc(src);
    setImgLoaded(false);
    setUseFallback(false);
    setFailed(false);
  }

  const watermarkedSrc = useFallback ? src : addWatermark(src);
  const displaySrc     = uploaded === true ? watermarkedSrc : pixelateUrl(src, 37);
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
      {/* Gizli img'ler — yalnızca yükleme/hata takibi; DOM'da görsel öğe değil */}
      {uploaded === true && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={watermarkedSrc} alt="" aria-hidden style={{ display: 'none' }}
          onLoad={() => setImgLoaded(true)} onError={handleError} />
      )}
      {uploaded === false && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={pixelateUrl(src, 37)} alt="" aria-hidden style={{ display: 'none' }}
          onLoad={() => setImgLoaded(true)} />
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

      {/* Görsel — <img> yok, sağ tık / uzun basma menüsünde "Save Image" çıkmaz */}
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
            imageRendering: uploaded === false ? 'pixelated' : undefined,
          }}
        />
      )}

      <div className="absolute inset-0" style={{ zIndex: 10 }} onContextMenu={e => e.preventDefault()} />
    </div>
  );
}
