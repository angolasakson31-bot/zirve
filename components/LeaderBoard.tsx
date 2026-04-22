'use client';
import { useEffect, useState, useCallback } from 'react';
import { Trophy, Star, Clock } from 'lucide-react';
import ProtectedImage from '@/components/ProtectedImage';
import UploadGate from '@/components/UploadGate';

interface LeaderPhoto {
  _id: string;
  url: string;
  average: number;
  voteCount: number;
  championDate?: string;
  contactInfo?: string;
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
    const interval = setInterval(fetchLeader, 5_000);
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
          <div>
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
            {leader.contactInfo && (
              <div className="px-4 py-3 border-t border-amber-500/20 bg-amber-500/5">
                <p className="text-amber-400/70 text-xs mb-0.5">İletişim — Namusunuzu zirveye taşıtın, size ulaşsınlar</p>
                <p className="text-zinc-300 text-sm break-all">{leader.contactInfo}</p>
              </div>
            )}
          </div>
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
          <UploadGate label="Dünün şampiyonunu görmek için fotoğraf yükle">
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
          </UploadGate>
        </div>
      )}

      {/* Reset saati */}
      <div className="flex items-center gap-1.5 px-1">
        <Clock className="w-3 h-3 text-zinc-600 flex-shrink-0" />
        <p className="text-zinc-600 text-xs">
          Liderlik tablosu her gün gece <span className="text-zinc-500">00:00</span>'da sıfırlanır ve yeni yarış başlar.
        </p>
      </div>
    </div>
  );
}
