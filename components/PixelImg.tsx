'use client';
import { useState } from 'react';
import { addWatermark, pixelateUrlSquare } from '@/lib/cloudinaryWatermark';
import { useUploadGate } from '@/hooks/useUploadGate';

interface Props {
  src: string;
  alt: string;
  className?: string;
  blurPlaceholder?: string;
}

export default function PixelImg({ src, alt, blurPlaceholder }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);
  const uploaded = useUploadGate();

  if (src !== prevSrc) {
    setPrevSrc(src);
    setLoaded(false);
  }

  const displaySrc = uploaded === true ? addWatermark(src) : pixelateUrlSquare(src, 22);

  return (
    <div className="relative w-full h-full" onContextMenu={e => e.preventDefault()}>
      {/* Gizli img — sadece yükleme takibi için; display:none render ağacından çıkarır */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={displaySrc}
        alt=""
        aria-hidden
        style={{ display: 'none' }}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />

      {!loaded && (
        blurPlaceholder ? (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${blurPlaceholder})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(8px)',
              transform: 'scale(1.1)',
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
        )
      )}

      {loaded && (
        <div
          className="absolute inset-0"
          role="img"
          aria-label={alt}
          style={{
            backgroundImage: `url(${displaySrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            imageRendering: uploaded !== true ? 'pixelated' : undefined,
          }}
        />
      )}
    </div>
  );
}
