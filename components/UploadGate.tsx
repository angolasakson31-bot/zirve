'use client';
import { useUploadGate } from '@/hooks/useUploadGate';
import { Lock } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  label?: string;
}

export default function UploadGate({ children, label }: Props) {
  const uploaded = useUploadGate();

  if (uploaded) return <>{children}</>;

  return (
    <div className="relative rounded-2xl overflow-hidden">
      <div className="pointer-events-none select-none brightness-50 saturate-50" style={{filter:'blur(10px)'}}>
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-black/30">
        <div className="w-12 h-12 rounded-2xl bg-zinc-800/90 flex items-center justify-center">
          <Lock className="w-5 h-5 text-amber-400" />
        </div>
        <div className="text-center px-6">
          <p className="text-white font-semibold text-sm">
            {label ?? 'İçeriği görmek için bir fotoğraf yükle'}
          </p>
          <p className="text-zinc-400 text-xs mt-1">
            Topluluğa katıl — bir fotoğraf paylaş, herkesi gör.
          </p>
        </div>
      </div>
    </div>
  );
}
