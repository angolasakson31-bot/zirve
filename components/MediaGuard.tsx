'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// Fotoğraf koruması. Tarayıcı işletim sisteminin ekran görüntüsünü
// engelleyemez; burada amaç bilinen yolları zorlaştırmak:
//  - pencere odağı kaybolunca / ekran alma kısayolu başlarken fotoğraflar
//    bulanıklaşır (html.zv-shield → globals.css)
//  - sağ tık / sürükleme yalnızca fotoğraflarda engellenir
//  - admin panelinde hiçbir kısıtlama yoktur
const SHIELD = 'zv-shield';
const PROTECTED = '[data-protected]';

function isProtected(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest(PROTECTED);
}

export default function MediaGuard() {
  const pathname = usePathname() ?? '';
  const disabled = pathname.startsWith('/admin');
  const [notice, setNotice] = useState(false);

  useEffect(() => {
    if (disabled) return;
    const root = document.documentElement;
    let noticeTimer: ReturnType<typeof setTimeout> | undefined;
    // Cmd+Shift sonrası kilitli: Mac'te seçim tuşlar bırakıldıktan sonra
    // yapılır, bu yüzden bir sonraki tıklamaya kadar bulanık kalır.
    let latched = false;

    const shield = () => root.classList.add(SHIELD);
    const unshield = () => {
      if (latched) return;
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        root.classList.remove(SHIELD);
      }
    };
    const flash = () => {
      shield();
      setNotice(true);
      clearTimeout(noticeTimer);
      noticeTimer = setTimeout(() => setNotice(false), 2500);
    };

    // Sağ tık ve sürükleme — sadece fotoğraf alanlarında
    const noCtx = (e: MouseEvent) => { if (isProtected(e.target)) e.preventDefault(); };
    const noDrag = (e: DragEvent) => { if (isProtected(e.target)) e.preventDefault(); };

    const onKeyDown = (e: KeyboardEvent) => {
      const { key, ctrlKey, metaKey, shiftKey } = e;
      const k = key.toLowerCase();
      // Mac: Cmd+Shift(+3/4/5) · Windows: Win (+Shift+S) — kısayol tamamlanmadan
      // fotoğrafları bulanıklaştır.
      if (metaKey && shiftKey) latched = true;
      if (key === 'Meta' || key === 'OS' || (metaKey && shiftKey)) shield();
      if (key === 'PrintScreen') flash();
      // Sayfayı kaydet / yazdır / kaynak / geliştirici araçları
      const mod = ctrlKey || metaKey;
      if (mod && ['s', 'p', 'u'].includes(k)) e.preventDefault();
      if (mod && shiftKey && ['i', 'j', 'c'].includes(k)) e.preventDefault();
      if (key === 'F12') e.preventDefault();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        // Windows PrtSc görüntüyü panoya koyar; panoyu ezmeyi dene.
        flash();
        navigator.clipboard?.writeText('').catch(() => {});
        return;
      }
      if (e.key === 'Meta' || e.key === 'OS') setTimeout(unshield, 400);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') shield();
      else unshield();
    };

    // Takılı kalırsa kullanıcı etkileşimiyle geri aç
    const onPointer = () => { latched = false; unshield(); };
    const onFocus = () => { latched = false; unshield(); };

    // Yazdırma — globals.css @media print ile fotoğraflar zaten gizli
    const onBeforePrint = () => shield();

    document.addEventListener('contextmenu', noCtx, true);
    document.addEventListener('dragstart', noDrag, true);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('keyup', onKeyUp, true);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('pointerdown', onPointer, true);
    window.addEventListener('blur', shield);
    window.addEventListener('focus', onFocus);
    window.addEventListener('beforeprint', onBeforePrint);

    if (!document.hasFocus()) shield();

    return () => {
      clearTimeout(noticeTimer);
      root.classList.remove(SHIELD);
      document.removeEventListener('contextmenu', noCtx, true);
      document.removeEventListener('dragstart', noDrag, true);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('keyup', onKeyUp, true);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('pointerdown', onPointer, true);
      window.removeEventListener('blur', shield);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('beforeprint', onBeforePrint);
    };
  }, [disabled]);

  if (disabled || !notice) return null;

  return (
    <div className="fixed top-4 inset-x-0 z-[9999] flex justify-center pointer-events-none px-4">
      <p className="rounded-xl bg-red-950/90 border border-red-800/60 px-4 py-2 text-red-200 text-xs shadow-lg">
        Ekran görüntüsü algılandı — fotoğraflar size özel kodla işaretlidir.
      </p>
    </div>
  );
}
