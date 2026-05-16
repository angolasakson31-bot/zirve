'use client';
import { useUploadGate } from '@/hooks/useUploadGate';

interface Props {
  children: React.ReactNode;
  label?: string;
  strong?: boolean;
  mini?: boolean;
}

export default function UploadGate({ children, label, mini }: Props) {
  const uploaded = useUploadGate();

  // null = henüz bilinmiyor, true = yükledi → blur gösterme
  // Böylece fotoğraf atan kullanıcılar sayfayı yenilediklerinde blur flash görmez
  if (uploaded !== false) return <>{children}</>;

  if (mini) {
    return (
      <div className="relative rounded-2xl overflow-hidden">
        <div className="pointer-events-none select-none">{children}</div>
        <div className="absolute inset-0 z-20 bg-black/20" />
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden">
      <div className="pointer-events-none select-none">{children}</div>
      <a href="#upload-form" className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20 bg-black/50">
        <p className="text-white font-bold text-base text-center px-6">
          {label ?? 'Görmek için fotoğraf yükle'}
        </p>
      </a>
    </div>
  );
}
