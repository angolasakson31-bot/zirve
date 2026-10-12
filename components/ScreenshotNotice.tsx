import { ShieldAlert } from 'lucide-react';

export default function ScreenshotNotice() {
  return (
    <p className="flex items-center justify-center gap-1.5 text-center text-[11px] leading-snug text-zinc-500">
      <ShieldAlert className="w-3 h-3 shrink-0 text-red-400/70" />
      Fotoğraflar size özel kodla işaretlidir. Ekran görüntüsü alıp paylaşmak TCK 134 kapsamında suçtur.
    </p>
  );
}
