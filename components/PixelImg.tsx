'use client';
import { useState } from 'react';
import { useUploadGate } from '@/hooks/useUploadGate';
import { thumbUrl } from '@/lib/cloudinaryWatermark';

interface Props {
  src: string;        // orijinal Cloudinary URL
  alt: string;
  size?: number;
  className?: string;
  lazy?: boolean;
}

export default function PixelImg({ src, alt, size = 128, className = 'w-full h-full object-cover', lazy = true }: Props) {
  const [loaded, setLoaded] = useState(false);
  const uploaded = useUploadGate(); // null | true | false

  // Her iki durumda da aynı URL — sadece CSS filtresi değişir.
  // e_pixelate URL'i fail edince siyah görünüyordu; thumbUrl her zaman çalışır.
  const imgSrc = thumbUrl(src, size);
  const blurred = uploaded !== true;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt={alt}
        className={className}
        style={{
          display: loaded ? 'block' : 'none',
          filter: blurred ? 'blur(5px)' : undefined,
          transform: blurred ? 'scale(1.15)' : undefined,
        }}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        draggable={false}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
      />
      {!loaded && (
        <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
      )}
    </div>
  );
}
