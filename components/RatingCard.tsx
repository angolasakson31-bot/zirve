'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import ProtectedImage from '@/components/ProtectedImage';
import AlbumViewer from '@/components/AlbumViewer';
import UploadGate from '@/components/UploadGate';
import { ChevronRight, Send } from 'lucide-react';
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
  const [photo, setPhoto]     = useState<Photo | null>(null);
  const [loading, setLoading] = useState(false);
  const [noMore, setNoMore]   = useState(false);
  const [selected, setSelected] = useState(0);
  const [average, setAverage]   = useState<number | null>(null);
  const [voteCount, setVoteCount] = useState<number | null>(null);
  const [hover, setHover]     = useState(0);
  const [sliderVal, setSliderVal] = useState(5);
  const [comment, setComment]   = useState('');
  const [commented, setCommented] = useState(false);
  const seenIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  const lastDate = useRef(todayKey());

  const load = useCallback(async (silent = false) => {
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
    if (!silent) setLoading(true);
    setSelected(0);
    setAverage(null);
    setVoteCount(null);
    setHover(0);
    setSliderVal(5);
    setComment('');
    setCommented(false);

    const exc = Array.from(seenIds.current).join(',');
    try {
      const res  = await fetch(`/api/photos/random${exc ? `?exclude=${exc}` : ''}`);
      const data = await res.json();
      if (!data.photo) {
        setNoMore(true);
        setPhoto(null);
      } else {
        seenIds.current.add(String(data.photo._id));
        saveSeenToStorage(seenIds.current);
        setPhoto(data.photo);
        setNoMore(false);
      }
    } catch {
      setNoMore(true);
    }
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = () => {
      // Kendi yüklediğimiz fotoğraf hariç, seen listesini temizle ve yeniden dene
      seenIds.current = new Set();
      saveSeenToStorage(seenIds.current);
      load();
    };
    window.addEventListener('zirve:photoUploaded', handler);
    return () => window.removeEventListener('zirve:photoUploaded', handler);
  }, [load]);

  useEffect(() => {
    if (!noMore) return;
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [noMore, load]);

  const submitComment = async () => {
    if (!photo || !comment.trim() || commented) return;
    setCommented(true);
    try {
      await fetch('/api/photos/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: photo._id, text: comment.trim() }),
      });
    } catch {
      setCommented(false);
    }
  };

  const vote = async (score: number) => {
    if (!photo || selected) return;
    setSelected(score);

    try {
      const res  = await fetch('/api/photos/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: photo._id, score }),
      });
      const data = await res.json();
      if (res.ok && data.photo) {
        setAverage(data.photo.average);
        setVoteCount(data.photo.voteCount);
        markVoted();
        if (data.leaderChanged) {
          window.dispatchEvent(new CustomEvent('zirve:leaderChanged'));
        }
      }
    } catch {
      // sessizce devam et
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

  const voted = selected > 0;

  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-900 overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-800">
        <span className="text-zinc-400 text-sm font-medium">Körlemesine Puan Ver</span>
      </div>

      <AlbumViewer urls={[photo.url, ...(photo.albumUrls ?? [])]} maxHeight={680} />

      <div className="p-4 space-y-3">
        {!voted ? (
          <>
            <p className="text-zinc-500 text-xs text-center">1 = Çok kötü &nbsp;·&nbsp; 10 = Mükemmel</p>
            <div className="bg-zinc-800 rounded-xl px-3 py-2.5 flex items-center gap-3">
              <input
                type="range" min={1} max={10} step={1}
                value={sliderVal}
                onChange={e => { setSliderVal(Number(e.target.value)); setHover(0); }}
                className="flex-1 accent-amber-400 cursor-pointer h-2"
              />
              <button
                onClick={() => vote(sliderVal)}
                className="w-11 h-10 rounded-xl bg-amber-400 text-black font-black text-xl flex-shrink-0 hover:bg-amber-300 active:scale-95 transition-all">
                {sliderVal}
              </button>
            </div>
            <div className="flex justify-center gap-1.5 flex-wrap">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                <button key={n}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => vote(n)}
                  className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                    (hover > 0 ? hover : sliderVal) >= n
                      ? 'bg-amber-400 text-black scale-110'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }`}>
                  {n}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-3">
              <div className="text-center">
                <p className="text-zinc-500 text-xs">Senin puanın</p>
                <p className="text-white font-black text-3xl">{selected}</p>
              </div>
              <div className="w-px h-10 bg-zinc-700" />
              <div className="text-center">
                <p className="text-zinc-500 text-xs">Topluluk ortalaması</p>
                <p className="text-amber-400 font-black text-3xl">
                  {average !== null ? average.toFixed(1) : '—'}
                </p>
                {voteCount !== null && (
                  <p className="text-zinc-600 text-xs">{voteCount} oy</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={60}
                placeholder={commented ? 'Yorum gönderildi!' : 'Kısa yorum yaz... (isteğe bağlı)'}
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitComment()}
                disabled={commented}
                className="flex-1 bg-zinc-800 text-white text-sm rounded-xl px-3 py-2 outline-none border border-zinc-700 focus:border-amber-500/40 placeholder:text-zinc-600 disabled:opacity-50 min-w-0"
              />
              <button
                onClick={submitComment}
                disabled={!comment.trim() || commented}
                className="flex-shrink-0 w-10 h-10 rounded-xl bg-zinc-700 flex items-center justify-center text-zinc-400 hover:bg-amber-500/20 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        <button
          onClick={() => load(true)}
          disabled={!voted}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition
            bg-white text-black hover:bg-zinc-100
            disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed">
          Sonraki <ChevronRight className="w-4 h-4" />
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
          Sonraki <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

export default function RatingCard() {
  const uploaded = useUploadGate();
  if (!uploaded) return (
    <UploadGate label="Oy vermek için önce bir fotoğraf yükle" strong>
      <Preview />
    </UploadGate>
  );
  return <Inner />;
}
