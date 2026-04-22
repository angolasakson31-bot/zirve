'use client';
import { useUploadGate } from '@/hooks/useUploadGate';
import { Lock } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  label?: string;
  blurOnly?: boolean;
  strong?: boolean;
  mini?: boolean;
}

export default function UploadGate({ children, label, blurOnly, strong, mini }: Props) {
  const uploaded = useUploadGate();

  if (uploaded) return <>{children}</>;

  if (blurOnly) {
    return (
      <div className="rounded-2xl overflow-hidden pointer-events-none select-none" style={{ filter: 'blur(4px)', opacity: 0.7 }}>
        {children}
      </div>
    );
  }

  if (mini) {
    return (
      <div className="relative rounded-2xl overflow-hidden">
        <div className="pointer-events-none select-none brightness-75 saturate-50 blur-[2px] sm:blur-[4px]">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/30">
          <div className="w-9 h-9 rounded-xl bg-zinc-800/90 border border-amber-500/50 flex items-center justify-center shadow-lg">
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
        </div>
      </div>
    );
  }

  const blurAmount = strong ? '10px' : '4px';

  return (
    <div className="relative rounded-2xl overflow-hidden">
      <div className="pointer-events-none select-none brightness-75 saturate-50" style={{ filter: `blur(${blurAmount})` }}>
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-black/50">
        <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-amber-500/40 flex items-center justify-center">
          <Lock className="w-5 h-5 text-amber-400" />
        </div>
        <p className="text-white font-bold text-base text-center px-6">
          {label ?? 'Görmek için fotoğraf yükle'}
        </p>
      </div>
    </div>
  );
}
