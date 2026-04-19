'use client';
import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Shuffle, Star, ChevronRight } from 'lucide-react';

interface Photo {
  _id: string;
  url: string;
}

interface RatedResult {
  average: number;
  voteCount: number;
  myScore: number;
}

export default function RatingCard() {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(false);
  const [voted, setVoted] = useState(false);
  const [result, setResult] = useState<RatedResult | null>(null);
  const [hover, setHover] = useState(0);
  const [noMore, setNoMore] = useState(false);

  const fetchRandom = useCallback(async () => {
    setLoading(true);
    setVoted(false);
    setResult(null);
    setHover(0);
    const res = await fetch('/api/photos/random');
    const { photo } = await res.json();
    if (!photo) setNoMore(true);
    else { setPhoto(photo); setNoMore(false); }
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
    const { photo: updated } = await res.json();
    setResult({ average: updated.average, voteCount: updated.voteCount, myScore: score });
    setVoted(true);
  };

  if (!photo && !loading && !noMore) {
    return (
      <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-8 flex flex-col items-center gap-4">
        <Shuffle className="w-10 h-10 text-zinc-500" />
        <p className="text-zinc-400 text-center text-sm">Rastgele bir fotoğraf keşfet ve puan ver.</p>
        <button
          onClick={fetchRandom}
          className="flex items-center gap-2 bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-zinc-100 transition"
        >
          <Shuffle className="w-4 h-4" /> Rastgele Getir
        </button>
      </div>
    );
  }

  if (noMore) {
    return (
      <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-8 flex flex-col items-center gap-3">
        <p className="text-zinc-400 text-sm text-center">Tüm fotoğrafları oyladınız!</p>
        <button onClick={fetchRandom} className="text-white underline text-sm">Tekrar dene</button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-900 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
        <span className="text-zinc-400 text-sm font-medium">Körlemesine Puan Ver</span>
        <button
          onClick={fetchRandom}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
        >
          <Shuffle className="w-3.5 h-3.5" /> Diğeri
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse bg-zinc-800 aspect-square" />
      ) : photo ? (
        <>
          <div className="relative w-full aspect-square overflow-hidden bg-zinc-800">
            <Image src={photo.url} alt="Puan ver" fill className="object-cover" />
            {voted && result && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                <div className="text-center">
                  <p className="text-zinc-300 text-sm mb-1">Senin puanın</p>
                  <p className="text-white font-black text-5xl">{result.myScore}</p>
                </div>
                <div className="h-px w-16 bg-zinc-600" />
                <div className="text-center">
                  <p className="text-zinc-300 text-sm mb-1">Topluluk ortalaması</p>
                  <p className="text-amber-400 font-bold text-3xl">{result.average.toFixed(2)}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{result.voteCount} oy</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 space-y-4">
            {!voted ? (
              <>
                <p className="text-zinc-400 text-xs text-center">1 = Çok kötü &nbsp;·&nbsp; 10 = Mükemmel</p>
                <div className="flex justify-center gap-1.5">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => vote(n)}
                      className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                        hover >= n
                          ? 'bg-amber-400 text-black scale-110'
                          : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <button
                onClick={fetchRandom}
                className="w-full flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-100 transition"
              >
                Sonraki <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
