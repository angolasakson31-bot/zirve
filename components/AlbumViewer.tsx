'use client';
import { useState } from 'react';
import { Images } from 'lucide-react';
import ProtectedImage from '@/components/ProtectedImage';

interface Props {
  urls: string[];      // [mainUrl, ...albumUrls]
  maxHeight?: number;
  dimmed?: boolean;
}

export default function AlbumViewer({ urls, maxHeight, dimmed }: Props) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const isAlbum = urls.length > 1;

  return (
    <>
      <div
        className={isAlbum ? 'cursor-zoom-in' : undefined}
        onClick={isAlbum ? () => setLightbox(urls[active]) : undefined}
      >
        <div className="relative">
          <ProtectedImage src={urls[active]} alt="Fotoğraf" maxHeight={maxHeight} dimmed={dimmed} />
          {isAlbum && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur text-white text-xs px-2 py-1 rounded-lg pointer-events-none">
              <Images className="w-3 h-3" />
              <span>Albüm · {urls.length}</span>
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
              className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                active === i
                  ? 'border-amber-400 opacity-100'
                  : 'border-zinc-700 opacity-50 hover:opacity-80'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Tam boyut"
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
