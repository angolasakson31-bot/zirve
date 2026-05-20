'use client';
import { useState } from 'react';
import type { ReactNode } from 'react';
import ProtectedImage from '@/components/ProtectedImage';
import PixelImg from '@/components/PixelImg';
import { useUploadGate } from '@/hooks/useUploadGate';
import { addWatermark } from '@/lib/cloudinaryWatermark';

interface Props {
  urls: string[];
  maxHeight?: number;
  dimmed?: boolean;
  bottomOverlay?: ReactNode;
  blurPlaceholder?: string;
}

export default function AlbumViewer({ urls, maxHeight, dimmed, bottomOverlay, blurPlaceholder }: Props) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const uploaded = useUploadGate();
  const isAlbum = urls.length > 1;

  return (
    <>
      <div
        className={uploaded ? 'cursor-zoom-in' : undefined}
        onClick={() => uploaded && setLightbox(urls[active])}
      >
        <div className="relative">
          <ProtectedImage src={urls[active]} alt="Fotoğraf" maxHeight={maxHeight} dimmed={dimmed} blurPlaceholder={active === 0 ? blurPlaceholder : undefined} />
          {bottomOverlay && (
            <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
              {bottomOverlay}
            </div>
          )}
        </div>
      </div>

      {isAlbum && (
        <div className="flex gap-2 px-3 py-2 bg-zinc-950/60 overflow-x-auto">
          {urls.map((url, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                active === i
                  ? 'border-amber-400 opacity-100'
                  : 'border-zinc-700 opacity-50 hover:opacity-80'
              }`}
            >
              <PixelImg src={url} alt={`Foto ${i + 1}`} />
            </button>
          ))}
        </div>
      )}

      {lightbox && uploaded && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-full max-h-full" onContextMenu={e => e.preventDefault()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={addWatermark(lightbox)}
              alt="Tam boyut"
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl select-none"
              draggable={false}
            />
          </div>
        </div>
      )}
    </>
  );
}
