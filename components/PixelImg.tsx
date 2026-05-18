'use client';
import { useState, useEffect } from 'react';
import { useUploadGate } from '@/hooks/useUploadGate';
import { thumbUrl, thumbPixelateUrl } from '@/lib/cloudinaryWatermark';

interface Props {
  src: string;        // orijinal Cloudinary URL
  alt: string;
  size?: number;      // thumbnail boyutu (px), default 128
  className?: string;
  lazy?: boolean;
}

export default function PixelImg({ src, alt, size = 128, className = 'w-full h-full object-cover', lazy = true }: Props) {
  const [loaded, setLoaded] = useState(false);
  const uploaded = useUploadGate(); // null | true | false

  const imgSrc = uploaded === false
    ? thumbPixelateUrl(src, size)
    : thumbUrl(src, size);

  // imgSrc değişince (uploaded null→false/true geçişi) skeleton tekrar göster
  useEffect(() => {
    setLoaded(false);
  }, [imgSrc]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt={alt}
        className={className}
        style={{ display: loaded ? 'block' : 'none' }}
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
