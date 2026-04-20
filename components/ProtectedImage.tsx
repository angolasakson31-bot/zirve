'use client';
import { useEffect, useRef, useState } from 'react';

interface Props {
  src: string;
  alt: string;
  className?: string;
  watermark?: string;
}

export default function ProtectedImage({ src, alt, className = '', watermark = 'ZİRVE' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      // Diagonal watermark grid
      const step = Math.max(100, canvas.width / 4);
      const fontSize = Math.max(12, canvas.width / 18);
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.rotate(-Math.PI / 6);
      for (let y = -canvas.height * 2; y < canvas.height * 2; y += step) {
        for (let x = -canvas.width * 2; x < canvas.width * 2; x += step) {
          ctx.fillText(watermark, x, y);
        }
      }
      ctx.restore();
      setLoaded(true);
    };
    img.onerror = () => {
      // Fallback: show image directly if canvas fails
      const canvas = canvasRef.current;
      if (canvas) canvas.style.backgroundImage = `url(${src})`;
      setLoaded(true);
    };
  }, [src, watermark]);

  return (
    <div
      className={`relative select-none ${className}`}
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
    >
      <canvas
        ref={canvasRef}
        aria-label={alt}
        className="w-full h-full object-cover"
        style={{ display: loaded ? 'block' : 'none' }}
      />
      {!loaded && <div className="w-full h-full bg-zinc-800 animate-pulse" />}
      {/* Transparent overlay — blocks right-click on the image itself */}
      <div className="absolute inset-0" onContextMenu={e => e.preventDefault()} />
    </div>
  );
}
