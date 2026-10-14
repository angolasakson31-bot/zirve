'use client';
import { useState } from 'react';
import { addWatermark, pixelateUrl } from '@/lib/cloudinaryWatermark';
import WatermarkOverlay from '@/components/WatermarkOverlay';

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
  // Fotoğrafın en/boy oranı — görüntü kutusu buna göre boyutlanır ki
  // filigran fotoğrafın dışındaki boşluğa taşmasın.
  const [ratio, setRatio]         = useState<number | null>(null);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setImgLoaded(false);
    setUseFallback(false);
    setFailed(false);
    setRatio(null);
  }

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    if (w && h) setRatio(w / h);
    setImgLoaded(true);
  };

  const watermarkedSrc = useFallback ? src : addWatermark(src);
  const displaySrc     = pixelate ? pixelateUrl(src, 20) : watermarkedSrc;
  const handleError    = () => { if (!useFallback) setUseFallback(true); else setFailed(true); };
  const showSkel       = !imgLoaded && !failed;
  const skelH          = Math.min(maxHeight, 400);

  return (
    <div
      data-protected
      className="relative w-full overflow-hidden select-none"
      style={{ maxHeight }}
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
    >
      {/* Gizli img — yalnızca yükleme/hata takibi */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {pixelate ? (
        <img src={pixelateUrl(src, 20)} alt="" aria-hidden style={{ display: 'none' }}
          onLoad={onImgLoad} />
      ) : (
        <img src={watermarkedSrc} alt="" aria-hidden style={{ display: 'none' }}
          onLoad={onImgLoad} onError={handleError} />
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
        <div className="w-full flex items-center justify-center" style={{ height: skelH }}>
          {/* Kutu fotoğrafın oranında — filigran sadece fotoğrafın üstünde kalır */}
          <div
            role="img"
            aria-label={alt}
            className="relative overflow-hidden"
            style={{
              backgroundImage: `url(${displaySrc})`,
              backgroundSize: ratio ? '100% 100%' : 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              ...(ratio
                ? { width: `min(100%, ${Math.round(skelH * ratio)}px)`, aspectRatio: String(ratio) }
                : { width: '100%', height: skelH }),
              opacity: dimmed ? 0.7 : 1,
              imageRendering: pixelate ? 'pixelated' : undefined,
            }}
          >
            {!pixelate && <WatermarkOverlay />}
          </div>
        </div>
      )}

      <div className="absolute inset-0" style={{ zIndex: 10 }} onContextMenu={e => e.preventDefault()} />
    </div>
  );
}
