'use client';
import { useEffect, useState, useCallback } from 'react';
import { Trophy, Star } from 'lucide-react';
import Image from 'next/image';

interface LeaderPhoto {
  _id: string;
  url: string;
  average: number;
  voteCount: number;
  championDate?: string;
}

export default function LeaderBoard() {
  const [leader, setLeader] = useState<LeaderPhoto | null>(null);
  const [yesterday, setYesterday] = useState<LeaderPhoto | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeader = useCallback(async () => {
    const res = await fetch('/api/leader', { cache: 'no-store' });
    if (!res.ok) return;
    const { leader, yesterday } = await res.json();
    setLeader(leader);
    setYesterday(yesterday);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeader();
    // Gerçek zamanlı güncelleme: 15 saniyede bir polling
    const interval = setInterval(fetchLeader, 15_000);
    return () => clearInterval(interval);
  }, [fetchLeader]);

  if (loading) return (
    <div className="animate-pulse bg-zinc-800 rounded-2xl h-96 w-full" />
  );

  return (
    <div className="space-y-6">
      {/* Günün Lideri */}
      <div className="rounded-2xl overflow-hidden border border-amber-500/30 bg-zinc-900">
        <div className="flex items-center gap-2 px-5 py-3 bg-amber-500/10 border-b border-amber-500/20">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h2 className="font-bold text-amber-400 tracking-wide text-sm uppercase">Günün Lideri</h2>
        </div>
        {leader ? (
          <div className="relative">
            <div className="relative w-full aspect-square max-h-[480px] overflow-hidden">
              <Image src={leader.url} alt="Günün lideri" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-3">
                <div className="bg-black/60 backdrop-blur rounded-xl px-4 py-2 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-white font-bold text-lg">{leader.average.toFixed(2)}</span>
                  <span className="text-zinc-400 text-sm">/ 10</span>
                </div>
                <div className="bg-black/60 backdrop-blur rounded-xl px-3 py-2 text-zinc-300 text-sm">
                  {leader.voteCount} oy
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
            <Trophy className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Henüz lider yok — oy ver, zirveyi belirle!</p>
            <p className="text-xs mt-1 text-zinc-600">Minimum 20 oy gerekli</p>
          </div>
        )}
      </div>

      {/* Dünün Şampiyonu */}
      {yesterday && (
        <div className="rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-900">
          <div className="flex items-center gap-2 px-5 py-3 bg-zinc-800 border-b border-zinc-700">
            <Trophy className="w-4 h-4 text-zinc-400" />
            <h2 className="font-semibold text-zinc-400 tracking-wide text-sm uppercase">Dünün Şampiyonu</h2>
          </div>
          <div className="relative w-full aspect-video overflow-hidden">
            <Image src={yesterday.url} alt="Dünün şampiyonu" fill className="object-cover opacity-80 grayscale-[20%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <div className="bg-black/60 backdrop-blur rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-zinc-300 fill-zinc-300" />
                <span className="text-white font-bold">{yesterday.average.toFixed(2)}</span>
              </div>
              <span className="text-zinc-400 text-xs bg-black/60 backdrop-blur rounded-lg px-2 py-1.5">{yesterday.voteCount} oy</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
