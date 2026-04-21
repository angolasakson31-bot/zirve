'use client';
import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'ZİRVE', text: 'Fotoğrafını yükle, puanlandır, zirveye çık!', url });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={share}
      className="flex items-center gap-1.5 bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 rounded-full px-3 py-1 transition"
    >
      {copied
        ? <><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400 text-xs font-medium">Kopyalandı</span></>
        : <><Share2 className="w-3.5 h-3.5 text-zinc-400" /><span className="text-zinc-400 text-xs">Paylaş</span></>
      }
    </button>
  );
}
