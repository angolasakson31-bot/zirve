'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import AlbumViewer from '@/components/AlbumViewer';
import UploadGate from '@/components/UploadGate';
import { ChevronRight } from 'lucide-react';
import { useUploadGate, markVoted, todayKey } from '@/hooks/useUploadGate';

interface Photo { _id: string; url: string; albumUrls?: string[]; }

const SEEN_STORAGE_PREFIX = 'zirve_seen_';

function loadSeenFromStorage(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(SEEN_STORAGE_PREFIX + todayKey());
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeenToStorage(ids: Set<string>) {
  try {
    localStorage.setItem(SEEN_STORAGE_PREFIX + todayKey(), JSON.stringify(Array.from(ids)));
  } catch {}
}

function Inner() {
  const [photo, setPhoto]       = useState<Photo | null>(null);
  const [loading, setLoading]   = useState(false);
  const [nextBusy, setNextBusy] = useState(false);
  const [noMore, setNoMore]     = useState(false);
  const [score, setScore]       = useState(5);
  const [hover, setHover]       = useState(0);
  const [comment, setComment]   = useState('');
  const seenIds        = useRef<Set<string>>(new Set());
  const initialized    = useRef(false);
  const lastDate       = useRef(todayKey());
  const loadInProgress = useRef(false);
  const prefetchedPhoto = useRef<Photo | null>(null);

  const load = useCallback(async (silent = false) => {
    if (loadInProgress.current) return;
    loadInProgress.current = true;

    try {
      const currentDate = todayKey();
      if (lastDate.current !== currentDate) {
        seenIds.current = new Set();
        initialized.current = false;
        lastDate.current = currentDate;
      }
      if (!initialized.current) {
        seenIds.current = loadSeenFromStorage();
        initialized.current = true;
      }

      if (!silent) {
        setLoading(true);
        setScore(5);
        setHover(0);
        setComment('');
      } else {
        setNextBusy(true);
      }

      const exc = Array.from(seenIds.current).join(',');
      let fetchOk = false;
      let nextPhoto: Photo | null = null;
      try {
        const res = await fetch('/api/photos/random' + (exc ? `?exclude=${exc}` : ''));
        if (res.ok) {
          fetchOk = true;
          const data = await res.json();
          nextPhoto = data.photo ?? null;
        }
      } catch {}

      if (fetchOk) {
        if (nextPhoto) {
          seenIds.current.add(String(nextPhoto._id));
          saveSeenToStorage(seenIds.current);
          if (silent) {
            setScore(5);
            setHover(0);
            setComment('');
          }
          prefetchedPhoto.current = null; // önceki prefetch'i sıfırla
          setPhoto(nextPhoto);
          setNoMore(false);

          // Sonraki fotoğrafı arka planda prefetch et
          const exc2 = Array.from(seenIds.current).join(',');
          fetch('/api/photos/random' + (exc2 ? `?exclude=${exc2}` : ''))
            .then(r => r.ok ? r.json() : null)
            .then(d => {
              if (d?.photo) {
                prefetchedPhoto.current = d.photo;
                // Görseli de önceden yükle
                const img = new window.Image();
                img.src = d.photo.url;
                if (d.photo.albumUrls?.length) img.src = d.photo.albumUrls[0];
              }
            })
            .catch(() => {});
        } else {
          setNoMore(true);
          setPhoto(null);
        }
      }
      // fetch failed (rate limit / network) — kullanıcı mevcut fotoğrafta kalır
    } finally {
      if (!silent) setLoading(false);
      setNextBusy(false);
      loadInProgress.current = false;
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = () => {
      seenIds.current = new Set();
      saveSeenToStorage(seenIds.current);
      initialized.current = false;
      prefetchedPhoto.current = null;
      load();
    };
    window.addEventListener('zirve:photoUploaded', handler);
    return () => window.removeEventListener('zirve:photoUploaded', handler);
  }, [load]);

  useEffect(() => {
    if (!noMore) return;
    const getExc = () => Array.from(seenIds.current).join(',');
    const check = async () => {
      try {
        const res = await fetch(`/api/photos/has-new?exclude=${getExc()}`);
        const data = await res.json();
        if (data.available > 0) load(true);
      } catch {}
    };
    check(); // Hemen kontrol et — yeni fotoğraf yeni yüklenmiş olabilir
    const interval = setInterval(check, 3_000);
    return () => clearInterval(interval);
  }, [noMore, load]);

  const handleVote = () => {
    if (!photo || loadInProgress.current) return;
    const photoId = photo._id;
    const commentText = comment.trim();

    // Oy gönder (sonucu beklemeden devam et)
    fetch('/api/photos/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId, score }),
    }).then(r => r.json()).then(data => {
      markVoted();
      if (data.leaderChanged) window.dispatchEvent(new CustomEvent('zirve:leaderChanged'));
    }).catch(() => {});

    // Yorum varsa gönder (fire and forget)
    if (commentText) {
      fetch('/api/photos/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, text: commentText }),
      }).then(() => {
        window.dispatchEvent(new CustomEvent('zirve:leaderChanged'));
      }).catch(() => {});
    }

    // Prefetch varsa anında geç, yoksa normal yükle
    const pre = prefetchedPhoto.current;
    if (pre) {
      prefetchedPhoto.current = null;
      seenIds.current.add(String(pre._id));
      saveSeenToStorage(seenIds.current);
      setScore(5); setHover(0); setComment('');
      setPhoto(pre);
      setNoMore(false);
      // Bir sonrakini arka planda getir
      const exc2 = Array.from(seenIds.current).join(',');
      fetch('/api/photos/random' + (exc2 ? `?exclude=${exc2}` : ''))
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.photo) { prefetchedPhoto.current = d.photo; new window.Image().src = d.photo.url; } })
        .catch(() => {});
    } else {
      load(true);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-700 bg-zinc-900 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800">
          <span className="text-zinc-400 text-sm font-medium">Körlemesine Puan Ver</span>
        </div>
        <div className="animate-pulse bg-zinc-800 h-72" />
        <div className="p-4 space-y-3">
          <div className="animate-pulse bg-zinc-800 h-10 rounded-xl" />
          <div className="animate-pulse bg-zinc-800 h-12 rounded-xl" />
        </div>
      </div>
    );
  }

  if (noMore) {
    return (
      <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-8 flex flex-col items-center gap-3">
        <p className="text-zinc-300 font-semibold">Bugünkü tüm fotoğrafları oyladınız!</p>
        <p className="text-zinc-500 text-sm">Yeni fotoğraflar yüklenince tekrar gel.</p>
      </div>
    );
  }

  if (!photo) return null;

  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-900 overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-800">
        <span className="text-zinc-400 text-sm font-medium">Körlemesine Puan Ver</span>
      </div>

      <AlbumViewer urls={[photo.url, ...(photo.albumUrls ?? [])]} maxHeight={680} />

      <div className="p-4 space-y-3">
        <p className="text-zinc-500 text-xs text-center">1 = Çok kötü &nbsp;·&nbsp; 10 = Mükemmel</p>
        <div className="bg-zinc-800 rounded-xl px-3 py-2.5 flex items-center gap-3">
          <span className="text-amber-400 font-black text-lg w-5 text-center flex-shrink-0">{score}</span>
          <input
            type="range" min={1} max={10} step={1}
            value={score}
            onChange={e => { setScore(Number(e.target.value)); setHover(0); }}
            className="flex-1 accent-amber-400 cursor-pointer h-2"
          />
        </div>
        <div className="flex justify-center gap-1.5 flex-wrap">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <button key={n}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => { setScore(n); setHover(0); }}
              className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                (hover > 0 ? hover : score) >= n
                  ? 'bg-amber-400 text-black scale-110'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}>
              {n}
            </button>
          ))}
        </div>
        <input
          type="text"
          maxLength={60}
          placeholder="İsteğe bağlı yorum bırak..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="w-full bg-zinc-800 text-white text-sm rounded-xl px-3 py-2 outline-none border border-zinc-700 focus:border-amber-500/40 placeholder:text-zinc-600"
        />

        <button
          disabled={nextBusy}
          onClick={handleVote}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition bg-white text-black hover:bg-zinc-100 disabled:opacity-60 disabled:cursor-not-allowed">
          {nextBusy
            ? <span className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" />
            : <>Puan Ver <ChevronRight className="w-4 h-4" /></>
          }
        </button>
      </div>
    </div>
  );
}

function Preview() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/photos/random')
      .then(r => r.json())
      .then(d => d.photo?.url && setPhotoUrl(d.photo.url))
      .catch(() => {});
  }, []);

  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-900 overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-800">
        <span className="text-zinc-400 text-sm font-medium">Körlemesine Puan Ver</span>
      </div>
      {photoUrl
        ? <AlbumViewer urls={[photoUrl]} maxHeight={680} />
        : <div className="bg-zinc-800 h-72" />
      }
      <div className="p-4 space-y-3">
        <p className="text-zinc-500 text-xs text-center">1 = Çok kötü &nbsp;·&nbsp; 10 = Mükemmel</p>
        <div className="bg-zinc-800 rounded-xl px-3 py-2.5 flex items-center gap-3">
          <div className="flex-1 h-2 bg-zinc-700 rounded-full" />
          <div className="w-11 h-10 rounded-xl bg-zinc-700 text-zinc-500 font-black text-xl flex-shrink-0 flex items-center justify-center">5</div>
        </div>
        <div className="flex justify-center gap-1.5 flex-wrap">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <div key={n} className="w-9 h-9 rounded-xl bg-zinc-700 text-zinc-300 text-sm font-bold flex items-center justify-center">
              {n}
            </div>
          ))}
        </div>
        <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-zinc-800 text-zinc-600 cursor-not-allowed">
          Puan Ver <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

export default function RatingCard() {
  const uploaded = useUploadGate(); // null | true | false
  // null = henüz bilinmiyor → Inner göster (localStorage okunana kadar)
  // false = yüklenmedi → gate göster
  if (uploaded === false) return (
    <UploadGate label="Oy vermek için önce bir fotoğraf yükle" strong>
      <Preview />
    </UploadGate>
  );
  return <Inner />;
}
