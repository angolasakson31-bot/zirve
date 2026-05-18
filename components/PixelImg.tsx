'use client';
import { useState } from 'react';
import { useUploadGate } from '@/hooks/useUploadGate';

interface Props {
  src: string;
  alt: string;
  className?: string;
  lazy?: boolean;
  forceShow?: boolean;
}

export default function PixelImg({ src, alt, className = 'w-full h-full object-cover', lazy = true, forceShow = false }: Props) {
  const [loaded, setLoaded] = useState(false);
  const uploaded = useUploadGate(); // null | true | false

  const isBlurred = !forceShow && uploaded === false;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={className}
        style={{
          display: loaded ? 'block' : 'none',
          filter: isBlurred ? 'blur(8px)' : undefined,
          transform: isBlurred ? 'scale(1.12)' : undefined,
          transition: 'filter 0.3s, transform 0.3s',
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
