'use client';
import { useState } from 'react';
import { addWatermark } from '@/lib/cloudinaryWatermark';

interface Props {
  src: string;
  alt: string;
  maxHeight?: number;
  dimmed?: boolean;
}

export default function ProtectedImage({ src, alt, maxHeight = 600, dimmed = false }: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{ maxHeight }}
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
    >
      {!loaded && (
        <div className="w-full animate-pulse bg-zinc-800" style={{ height: Math.min(maxHeight, 400) }} />
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={addWatermark(src)}
        alt={alt}
        className={`w-full object-contain ${dimmed ? 'opacity-70' : ''}`}
        style={{ maxHeight, display: loaded ? 'block' : 'none' }}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        draggable={false}
      />

      <div className="absolute inset-0" style={{ zIndex: 10 }} onContextMenu={e => e.preventDefault()} />
    </div>
  );
}
