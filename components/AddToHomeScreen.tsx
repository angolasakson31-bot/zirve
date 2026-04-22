'use client';
import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function AddToHomeScreen() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);

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

  if (!prompt) return null;

  const install = async () => {
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setPrompt(null);
  };

  return (
    <button
      onClick={install}
      className="flex items-center gap-1.5 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 rounded-full px-3 py-1 transition"
    >
      <Download className="w-3.5 h-3.5 text-amber-400" />
      <span className="text-amber-400 text-xs font-medium">Ana Sayfaya Ekle</span>
    </button>
  );
}
