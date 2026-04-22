'use client';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Images } from 'lucide-react';
import ProtectedImage from '@/components/ProtectedImage';

interface Props {
  urls: string[];      // [mainUrl, ...albumUrls]
  maxHeight?: number;
  dimmed?: boolean;
  bottomOverlay?: ReactNode;
}

export default function AlbumViewer({ urls, maxHeight, dimmed, bottomOverlay }: Props) {
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
              className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                active === i
                  ? 'border-amber-400 opacity-100'
                  : 'border-zinc-700 opacity-50 hover:opacity-80'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" style={{ opacity: 0.18 }}>
                {Array.from({ length: 6 }, (_, r) => (
                  <div key={r} style={{ position: 'absolute', top: `${r * 18 - 10}%`, left: '-20%', transform: 'rotate(-30deg)', whiteSpace: 'nowrap', color: '#fff', fontWeight: 900, fontSize: '7px', letterSpacing: '1px' }}>
                    ZİRVE NAMUS &nbsp; ZİRVE NAMUS &nbsp; ZİRVE NAMUS
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-full max-h-full" onContextMenu={e => e.preventDefault()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox}
              alt="Tam boyut"
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl select-none"
              draggable={false}
            />
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden rounded-xl" style={{ opacity: 0.13 }}>
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} style={{ position: 'absolute', top: `${i * 9 - 5}%`, left: '-10%', transform: 'rotate(-25deg)', whiteSpace: 'nowrap', color: '#fff', fontWeight: 900, fontSize: '18px', letterSpacing: '4px' }}>
                  {'ZİRVE NAMUS   ZİRVE NAMUS   ZİRVE NAMUS   ZİRVE NAMUS   ZİRVE NAMUS'}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
