'use client';
import { useState, useCallback, useRef } from 'react';
import ProtectedImage from '@/components/ProtectedImage';
import UploadGate from '@/components/UploadGate';
import { Shuffle, ChevronRight } from 'lucide-react';

interface Photo { _id: string; url: string; }
interface RatedResult { average: number; voteCount: number; myScore: number; }

export default function RatingCard() {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(false);
  const [voted, setVoted] = useState(false);
  const [result, setResult] = useState<RatedResult | null>(null);
  const [hover, setHover] = useState(0);
  const [noMore, setNoMore] = useState(false);
  const seenIds = useRef<Set<string>>(new Set());

  const fetchRandom = useCallback(async () => {
    setLoading(true);
    setVoted(false);
    setResult(null);
    setHover(0);

    const exclude = Array.from(seenIds.current).join(',');
    const res = await fetch(`/api/photos/random${exclude ? `?exclude=${exclude}` : ''}`);
    const { photo } = await res.json();

    if (!photo) {
      setNoMore(true);
    } else {
      seenIds.current.add(photo._id);
      setPhoto(photo);
      setNoMore(false);
    }
    setLoading(false);
  }, []);

  const vote = async (score: number) => {
    if (!photo || voted) return;
    const res = await fetch('/api/photos/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId: photo._id, score }),
    });
    if (!res.ok) return;
    const data = await res.json();
    const updated = data.photo;
    setResult({ average: updated.average, voteCount: updated.voteCount, myScore: score });
    setVoted(true);
  };

  if (!photo && !loading && !noMore) {
    return (
      <UploadGate label="Oy vermek için önce bir fotoğraf yükle">
        <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-10 flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center">
            <Shuffle className="w-7 h-7 text-zinc-500" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold mb-1">Bugünün Fotoğrafları</p>
            <p className="text-zinc-400 text-sm">Rastgele bir fotoğraf getir ve puan ver.</p>
          </div>
          <button onClick={fetchRandom}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-bold px-6 py-3 rounded-xl transition">
            <Shuffle className="w-4 h-4" /> Rastgele Getir
          </button>
        </div>
      </UploadGate>
    );
  }

  if (noMore) {
    return (
      <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-8 flex flex-col items-center gap-3">
        <p className="text-zinc-300 font-semibold">Bugünkü tüm fotoğrafları oyladınız!</p>
        <p className="text-zinc-500 text-sm">Yeni fotoğraflar yüklenince tekrar gel.</p>
        <button onClick={() => { seenIds.current.clear(); fetchRandom(); }}
          className="mt-2 text-amber-400 underline text-sm">Tekrar dene</button>
      </div>
    );
  }

  return (
    <UploadGate label="Oy vermek için önce bir fotoğraf yükle">
    <div className="rounded-2xl border border-zinc-700 bg-zinc-900 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
        <span className="text-zinc-400 text-sm font-medium">Körlemesine Puan Ver</span>
        <button onClick={fetchRandom} disabled={loading}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition disabled:opacity-40">
          <Shuffle className="w-3.5 h-3.5" /> Diğeri
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse bg-zinc-800 h-72" />
      ) : photo ? (
        <>
          <ProtectedImage src={photo.url} alt="Puan ver" maxHeight={680} />

          <div className="p-4 space-y-4">
            {!voted ? (
              <>
                <p className="text-zinc-500 text-xs text-center">1 = Çok kötü &nbsp;·&nbsp; 10 = Mükemmel</p>
                <div className="flex justify-center gap-1.5 flex-wrap">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <button key={n}
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => vote(n)}
                      className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                        hover >= n ? 'bg-amber-400 text-black scale-110' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
              </>
            ) : result ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-3">
                  <div className="text-center">
                    <p className="text-zinc-500 text-xs">Senin puanın</p>
                    <p className="text-white font-black text-3xl">{result.myScore}</p>
                  </div>
                  <div className="w-px h-10 bg-zinc-700" />
                  <div className="text-center">
                    <p className="text-zinc-500 text-xs">Topluluk ortalaması</p>
                    <p className="text-amber-400 font-black text-3xl">{result.average.toFixed(1)}</p>
                    <p className="text-zinc-600 text-xs">{result.voteCount} oy</p>
                  </div>
                </div>
                <button onClick={fetchRandom}
                  className="w-full flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-100 transition">
                  Sonraki <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
    </UploadGate>
  );
}
