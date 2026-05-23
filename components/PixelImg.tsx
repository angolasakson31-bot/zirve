'use client';
import { useState } from 'react';
import { addWatermark, pixelateUrlSquare } from '@/lib/cloudinaryWatermark';

interface Props {
  src: string;
  alt: string;
  className?: string;
  blurPlaceholder?: string;
  pixelate?: boolean;
}

export default function PixelImg({ src, alt, blurPlaceholder, pixelate }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setLoaded(false);
  }

  const displaySrc = pixelate ? pixelateUrlSquare(src, 6) : addWatermark(src);

  return (
    <div className="relative w-full h-full" onContextMenu={e => e.preventDefault()}>
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
            imageRendering: pixelate ? 'pixelated' : undefined,
          }}
        />
      )}
    </div>
  );
}
