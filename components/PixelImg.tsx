'use client';
import { useState } from 'react';
import { addWatermark, pixelateUrlSquare } from '@/lib/cloudinaryWatermark';
import { useUploadGate } from '@/hooks/useUploadGate';

interface Props {
  src: string;         // orijinal URL (watermark eklenmemiş)
  alt: string;
  className?: string;
  blurPlaceholder?: string;
}

export default function PixelImg({ src, alt, className = 'w-full h-full object-cover', blurPlaceholder }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);
  const uploaded = useUploadGate();

  if (src !== prevSrc) {
    setPrevSrc(src);
    setLoaded(false);
  }

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        blurPlaceholder ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={blurPlaceholder} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'blur(8px)', transform: 'scale(1.1)' }} />
        ) : (
          <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
        )
      )}

      {uploaded === true && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={addWatermark(src)}
          alt={alt}
          className={className}
          style={{ display: loaded ? undefined : 'none' }}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          draggable={false}
        />
      )}

      {(uploaded === false || uploaded === null) && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={pixelateUrlSquare(src, 8)}
          alt={alt}
          className={className}
          style={{ display: loaded ? undefined : 'none', imageRendering: 'pixelated' }}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          draggable={false}
        />
      )}
    </div>
  );
}
