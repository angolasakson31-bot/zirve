'use client';
import { useState } from 'react';
import { useUploadGate } from '@/hooks/useUploadGate';
import { thumbPixelateUrl } from '@/lib/cloudinaryWatermark';

interface Props {
  src: string;
  alt: string;
  className?: string;
  lazy?: boolean;
}

export default function PixelImg({ src, alt, className = 'w-full h-full object-cover', lazy = true }: Props) {
  const [loaded, setLoaded] = useState(false);
  const uploaded = useUploadGate(); // null | true | false

  // uploaded=false → pikselleştirilmiş thumbnail (Cloudinary e_pixelate)
  // uploaded=null|true → normal thumbnail (zaten thumbUrl ile geliyor)
  const imgSrc = uploaded === false ? thumbPixelateUrl(src) : src;

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
