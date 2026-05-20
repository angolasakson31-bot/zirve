'use client';
import { useEffect, useState } from 'react';

export default function MediaGuard() {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    // Sağ tık engeli — capture phase ile en erken yakalanır
    const noCtx = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', noCtx, true);

    // Klavye kısayolları engeli: PrintScreen, F12, Ctrl/Cmd+S/U/P, DevTools
    const noKeys = (e: KeyboardEvent) => {
      const { key, ctrlKey, metaKey, shiftKey } = e;
      const mod = ctrlKey || metaKey;
      if (key === 'PrintScreen') {
        e.preventDefault();
        setBlocked(true);
        setTimeout(() => setBlocked(false), 2000);
      }
      if (mod && ['s', 'u', 'p'].includes(key.toLowerCase())) e.preventDefault();
      if (mod && shiftKey && ['i', 'j', 'c'].includes(key.toLowerCase())) e.preventDefault();
      if (key === 'F12') e.preventDefault();
    };
    document.addEventListener('keydown', noKeys);

    // Sürükleme engeli
    const noDrag = (e: DragEvent) => e.preventDefault();
    document.addEventListener('dragstart', noDrag);

    // Picture-in-Picture ekran kaydı tespiti
    const onPiP = () => setBlocked(true);
    const offPiP = () => setBlocked(false);
    document.addEventListener('enterpictureinpicture', onPiP);
    document.addEventListener('leavepictureinpicture', offPiP);

    return () => {
      document.removeEventListener('contextmenu', noCtx, true);
      document.removeEventListener('keydown', noKeys);
      document.removeEventListener('dragstart', noDrag);
      document.removeEventListener('enterpictureinpicture', onPiP);
      document.removeEventListener('leavepictureinpicture', offPiP);
    };
  }, []);

  if (!blocked) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-zinc-950 flex items-center justify-center">
      <p className="text-zinc-400 text-sm">Ekran kaydı tespit edildi.</p>
    </div>
  );
}
