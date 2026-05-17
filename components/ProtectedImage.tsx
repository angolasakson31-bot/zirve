'use client';
import { useState, useRef, useEffect } from 'react';
import { addWatermark } from '@/lib/cloudinaryWatermark';
import { useUploadGate } from '@/hooks/useUploadGate';

interface Props {
  src: string;
  alt: string;
  maxHeight?: number;
  dimmed?: boolean;
  priority?: boolean;
  forceShow?: boolean;
}

export default function ProtectedImage({ src, alt, maxHeight = 600, dimmed = false, priority = false, forceShow = false }: Props) {
  const [loaded, setLoaded]           = useState(false);
  const [pixelReady, setPixelReady]   = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [failed, setFailed]           = useState(false);
  const [retryKey, setRetryKey]       = useState(0);
  const imgRef    = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uploaded  = useUploadGate(); // null | true | false

  // src değişince state'i sıfırla — yeni fotoğraf eski hata state'ine düşmesin
  useEffect(() => {
    setLoaded(false);
    setPixelReady(false);
    setUseFallback(false);
    setFailed(false);
  }, [src]);

  useEffect(() => {
    if (forceShow || uploaded !== false || !loaded || failed) return;
    const img = imgRef.current;
    const cv  = canvasRef.current;
    if (!img || !cv || !img.naturalWidth) return;
    const w = Math.max(1, Math.floor(img.naturalWidth / 32));
    const h = Math.max(1, Math.floor(img.naturalHeight / 32));
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext('2d');
    if (ctx) {
      try {
        ctx.drawImage(img, 0, 0, w, h);
        setPixelReady(true);
      } catch {}
    }
  }, [loaded, uploaded, failed, forceShow]);

  const imgSrc = useFallback ? src : addWatermark(src);

  const handleError = () => {
    if (!useFallback) {
      // Watermark URL başarısız → orijinal URL'i dene
      setUseFallback(true);
    } else {
      // Orijinal de başarısız → broken icon yerine friendly error göster
      setFailed(true);
    }
  };

  const retry = () => {
    setFailed(false);
    setLoaded(false);
    setUseFallback(false);
    setPixelReady(false);
    setRetryKey(k => k + 1);
  };

  const showImg   = loaded && !failed && (forceShow || uploaded !== false);
  const showPixel = loaded && !failed && !forceShow && uploaded === false && pixelReady;
  const showSkel  = !failed && !showImg && !showPixel;

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{ maxHeight }}
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
    >
      {showSkel && (
        <div className="w-full animate-pulse bg-zinc-800" style={{ height: Math.min(maxHeight, 400) }} />
      )}

      {failed && (
        <div
          className="w-full flex flex-col items-center justify-center gap-2 bg-zinc-800/50 text-zinc-400"
          style={{ height: Math.min(maxHeight, 400) }}
        >
          <p className="text-xs">Fotoğraf yüklenemedi</p>
          <button
            onClick={retry}
            className="text-xs px-3 py-1 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-100"
          >
            Tekrar dene
          </button>
        </div>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={retryKey}
        ref={imgRef}
        src={imgSrc}
        alt={alt}
        className="w-full object-contain"
        style={{ maxHeight, display: showImg ? 'block' : 'none', opacity: dimmed ? 0.7 : 1 }}
        onLoad={() => setLoaded(true)}
        onError={handleError}
        draggable={false}
        // @ts-expect-error fetchpriority is a valid HTML attribute
        fetchpriority={priority ? 'high' : 'auto'}
      />

      {!forceShow && uploaded === false && (
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            display: showPixel ? 'block' : 'none',
            imageRendering: 'pixelated',
            opacity: dimmed ? 0.7 : 1,
          }}
        />
      )}

      <div className="absolute inset-0" style={{ zIndex: 10 }} onContextMenu={e => e.preventDefault()} />
    </div>
  );
}
