'use client';
import { useEffect, useState, useCallback } from 'react';
import { Trophy, Star, Lock } from 'lucide-react';
import ProtectedImage from '@/components/ProtectedImage';
import { useVoteGate } from '@/hooks/useUploadGate';

interface LeaderPhoto {
  _id: string;
  url: string;
  average: number;
  voteCount: number;
  championDate?: string;
}

function VoteGate({ children, label }: { children: React.ReactNode; label?: string }) {
  const voted = useVoteGate();

  if (voted) return <>{children}</>;

  return (
    <div className="relative rounded-2xl overflow-hidden">
      <div className="pointer-events-none select-none brightness-50 saturate-50" style={{ filter: 'blur(10px)' }}>
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-black/30">
        <div className="w-12 h-12 rounded-2xl bg-zinc-800/90 flex items-center justify-center">
          <Lock className="w-5 h-5 text-amber-400" />
        </div>
        <div className="text-center px-6">
          <p className="text-white font-semibold text-sm">
            {label ?? 'İçeriği görmek için oy ver'}
          </p>
          <p className="text-zinc-400 text-xs mt-1">
            Bir fotoğrafa puan ver ve liderleri gör.
          </p>
        </div>
      </div>
    </div>
  );
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
    const interval = setInterval(fetchLeader, 15_000);
    window.addEventListener('zirve:leaderChanged', fetchLeader);
    return () => {
      clearInterval(interval);
      window.removeEventListener('zirve:leaderChanged', fetchLeader);
    };
  }, [fetchLeader]);

  if (loading) return <div className="animate-pulse bg-zinc-800 rounded-2xl h-64 w-full" />;

  return (
    <div className="space-y-5">
      {/* Günün Lideri */}
      <div className="rounded-2xl overflow-hidden border border-amber-500/30 bg-zinc-900">
        <div className="flex items-center gap-2 px-5 py-3 bg-amber-500/10 border-b border-amber-500/20">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h2 className="font-bold text-amber-400 tracking-wide text-sm uppercase">Günün Lideri</h2>
        </div>
        {leader ? (
          <VoteGate label="Günün liderini görmek için oy ver">
            <div className="relative">
              <ProtectedImage src={leader.url} alt="Günün lideri" maxHeight={520} />
              <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
                <div className="bg-black/70 backdrop-blur rounded-xl px-4 py-2 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-white font-bold text-lg">{leader.average.toFixed(2)}</span>
                  <span className="text-zinc-400 text-sm">/ 10</span>
                </div>
                <div className="bg-black/70 backdrop-blur rounded-xl px-3 py-2 text-zinc-300 text-sm">
                  {leader.voteCount} oy
                </div>
              </div>
            </div>
          </VoteGate>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 text-zinc-500">
            <Trophy className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Henüz lider yok — oy ver, zirveyi belirle!</p>
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
          <VoteGate label="Dünün şampiyonunu görmek için oy ver">
            <div className="relative">
              <ProtectedImage src={yesterday.url} alt="Dünün şampiyonu" maxHeight={360} dimmed />
              <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
                <div className="bg-black/70 backdrop-blur rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-zinc-300 fill-zinc-300" />
                  <span className="text-white font-bold">{yesterday.average.toFixed(2)}</span>
                </div>
                <span className="text-zinc-400 text-xs bg-black/70 backdrop-blur rounded-lg px-2 py-1.5">{yesterday.voteCount} oy</span>
              </div>
            </div>
          </VoteGate>
        </div>
      )}
    </div>
  );
}
