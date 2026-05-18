'use client';
import { useState, useEffect } from 'react';
import { useUploadGate } from '@/hooks/useUploadGate';
import { thumbUrl } from '@/lib/cloudinaryWatermark';

interface Props {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  lazy?: boolean;
}

export default function PixelImg({ src, alt, size = 128, lazy = true }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const uploaded = useUploadGate();

  const blurred = uploaded !== true;
  // Engelli modda Cloudinary transform yok — orijinal URL + CSS scale trick ile pikselasyon.
  const imgSrc = blurred ? src : thumbUrl(src, size);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [imgSrc]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={imgSrc}
        src={imgSrc}
        alt={alt}
        style={blurred ? {
          display: loaded && !failed ? 'block' : 'none',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '20%',
          height: '20%',
          objectFit: 'cover',
          imageRendering: 'pixelated',
          transform: 'scale(5)',
          transformOrigin: '0 0',
        } : {
          display: loaded && !failed ? 'block' : 'none',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        draggable={false}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
      />
      {(!loaded || failed) && (
        <div className={`absolute inset-0 bg-zinc-800 ${!failed ? 'animate-pulse' : ''}`} />
      )}
    </div>
  );
}
