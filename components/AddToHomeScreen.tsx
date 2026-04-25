'use client';
import { useEffect, useState } from 'react';
import { Download, Check, Link } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function AddToHomeScreen() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setPrompt(null));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleClick = async () => {
    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') setPrompt(null);
    } else {
      const url = window.location.origin;
      try { await navigator.clipboard.writeText(url); } catch {}
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (copied) {
    return (
      <button className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1">
        <Check className="w-3.5 h-3.5 text-green-400" />
        <span className="text-green-400 text-xs font-medium">Link kopyalandı</span>
      </button>
    );
  }

  if (prompt) {
    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 rounded-full px-3 py-1 transition"
      >
        <Download className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-amber-400 text-xs font-medium">Ana Sayfaya Ekle</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 rounded-full px-3 py-1 transition"
    >
      <Link className="w-3.5 h-3.5 text-zinc-400" />
      <span className="text-zinc-400 text-xs">Site Linki</span>
    </button>
  );
}
