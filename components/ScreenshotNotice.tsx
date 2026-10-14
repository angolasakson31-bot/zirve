import { ShieldAlert } from 'lucide-react';

// Tek satırlık, sade uyarı — fotoğraf kartlarının altına değil, büyütülmüş
// görünüm (lightbox) ve sayfa altı gibi tek bir yerde gösterilir.
export default function ScreenshotNotice() {
  return (
    <p className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[11px] text-zinc-300 backdrop-blur">
      <ShieldAlert className="w-3 h-3 shrink-0 text-amber-400/80" />
      Size özel kodla işaretlidir · Paylaşmak suçtur (TCK 134)
    </p>
  );
}
