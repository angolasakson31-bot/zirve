'use client';
import { useState } from 'react';
import { Search, ThumbsUp, ThumbsDown, Star, Trophy, BarChart2 } from 'lucide-react';
import ProtectedImage from '@/components/ProtectedImage';

interface TrackResult {
  url: string;
  voteCount: number;
  average: number;
  likeCount: number;
  dislikeCount: number;
  isChampion: boolean;
  createdAt: string;
}

export default function TrackCode() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<TrackResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async () => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`/api/photos/track/${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Kod bulunamadı.');
      else setResult(data.photo);
    } catch {
      setError('Bağlantı hatası.');
    }
    setLoading(false);
  };

  const likeRate = result && result.voteCount > 0
    ? Math.round((result.likeCount / result.voteCount) * 100)
    : 0;

  return (
    <div className="rounded-2xl border border-zinc-700/80 bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-800">
        <BarChart2 className="w-4 h-4 text-zinc-400" />
        <span className="text-zinc-400 text-sm font-medium">Fotoğrafımı Takip Et</span>
      </div>
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="ZRV-XXXXX"
            maxLength={9}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 tracking-wider"
          />
          <button onClick={search} disabled={loading || !code.trim()}
            className="px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 rounded-xl transition disabled:opacity-40">
            {loading
              ? <span className="animate-spin w-4 h-4 border-2 border-zinc-400/30 border-t-zinc-300 rounded-full inline-block" />
              : <Search className="w-4 h-4 text-zinc-300" />}
          </button>
        </div>

        {error && <p className="text-red-400 text-xs px-1">{error}</p>}

        {result && (
          <div className="space-y-3 pt-1">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-800">
              <ProtectedImage src={result.url} alt="Fotoğrafın" className="absolute inset-0 w-full h-full" />
              {result.isChampion && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-400 text-black text-xs font-bold px-2 py-1 rounded-lg">
                  <Trophy className="w-3 h-3" /> Şampiyon
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-zinc-800 rounded-xl p-3 text-center">
                <Star className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <p className="text-white font-bold text-lg">{result.average.toFixed(1)}</p>
                <p className="text-zinc-500 text-xs">Ortalama</p>
              </div>
              <div className="bg-zinc-800 rounded-xl p-3 text-center">
                <ThumbsUp className="w-4 h-4 text-green-400 mx-auto mb-1" />
                <p className="text-white font-bold text-lg">{result.likeCount}</p>
                <p className="text-zinc-500 text-xs">Beğendi</p>
              </div>
              <div className="bg-zinc-800 rounded-xl p-3 text-center">
                <ThumbsDown className="w-4 h-4 text-red-400 mx-auto mb-1" />
                <p className="text-white font-bold text-lg">{result.dislikeCount}</p>
                <p className="text-zinc-500 text-xs">Beğenmedi</p>
              </div>
            </div>

            {result.voteCount > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>{result.voteCount} toplam oy</span>
                  <span>%{likeRate} beğendi</span>
                </div>
                <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all"
                    style={{ width: `${likeRate}%` }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
