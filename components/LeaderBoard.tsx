'use client';
import { useEffect, useState, useCallback } from 'react';
import { Trophy, Star, Clock } from 'lucide-react';
import AlbumViewer from '@/components/AlbumViewer';
import UploadGate from '@/components/UploadGate';
import { useUploadGate } from '@/hooks/useUploadGate';

interface LeaderPhoto {
  _id: string;
  url: string;
  albumUrls?: string[];
  average: number;
  voteCount: number;
  championDate?: string;
  contactInfo?: string;
}

interface RunnerUp {
  _id: string;
  url: string;
  average: number;
  voteCount: number;
}

const CONTACT_LABEL = 'Namusumu konuşmak için yazın';

function ContactBadge({ info, gold }: { info: string; gold?: boolean }) {
  const colonIdx = info.indexOf(': ');
  const platform = colonIdx !== -1 ? info.slice(0, colonIdx) : null;
  const value = colonIdx !== -1 ? info.slice(colonIdx + 2) : info;

  const platformColors: Record<string, string> = {
    Telegram: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    Instagram: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    Telefon: 'bg-green-500/20 text-green-300 border-green-500/30',
    'E-posta': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  };
  const platformStyle = platform ? (platformColors[platform] ?? 'bg-zinc-700/50 text-zinc-300 border-zinc-600/50') : null;

  return (
    <div className={`px-4 py-3 border-t ${gold ? 'border-amber-500/20 bg-amber-500/5' : 'border-zinc-700 bg-zinc-800/50'}`}>
      <p className={`text-xs mb-2 font-medium ${gold ? 'text-amber-400/70' : 'text-zinc-500'}`}>{CONTACT_LABEL}</p>
      <div className="flex items-center gap-2 flex-wrap">
        {platform && platformStyle && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${platformStyle}`}>{platform}</span>
        )}
        <span className={`text-sm font-semibold break-all ${gold ? 'text-white' : 'text-zinc-200'}`}>{value}</span>
      </div>
    </div>
  );
}

export default function LeaderBoard() {
  const [leader, setLeader] = useState<LeaderPhoto | null>(null);
  const [yesterday, setYesterday] = useState<LeaderPhoto | null>(null);
  const [runnerUps, setRunnerUps] = useState<RunnerUp[]>([]);
  const [activeRunner, setActiveRunner] = useState(0);
  const [loading, setLoading] = useState(true);
  const uploaded = useUploadGate();

  const fetchLeader = useCallback(async () => {
    const res = await fetch('/api/leader', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    setLeader(data.leader);
    setYesterday(data.yesterday);
    setRunnerUps(data.runnerUps ?? []);
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

  useEffect(() => {
    if (runnerUps.length < 2) return;
    const t = setInterval(() => setActiveRunner(i => (i + 1) % runnerUps.length), 3000);
    return () => clearInterval(t);
  }, [runnerUps.length]);

  if (loading) return <div className="animate-pulse bg-zinc-800 rounded-2xl h-64 w-full" />;

  return (
    <div className="space-y-5">
      {/* Günün + Dünün yanyana */}
      <div className="grid grid-cols-2 gap-3">

        {/* Günün Lider Namusu */}
        <div className="rounded-2xl overflow-hidden border border-amber-500/30 bg-zinc-900">
          <div className="flex items-center gap-2 px-5 py-3 bg-amber-500/10 border-b border-amber-500/20">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-amber-400 tracking-wide text-sm uppercase">Günün Lider Namusu</h2>
          </div>
          {leader ? (
            <div>
              <UploadGate label="Günün lider namusunu görmek için fotoğraf yükle">
                <AlbumViewer
                  urls={[leader.url, ...(leader.albumUrls ?? [])]}
                  maxHeight={320}
                  bottomOverlay={
                    <div className="flex items-center gap-2">
                      <div className="bg-black/70 backdrop-blur rounded-xl px-4 py-2 flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-white font-bold text-lg">{leader.average.toFixed(2)}</span>
                        <span className="text-zinc-400 text-sm">/ 10</span>
                      </div>
                      <div className="bg-black/70 backdrop-blur rounded-xl px-3 py-2 text-zinc-300 text-sm">
                        {leader.voteCount} oy
                      </div>
                    </div>
                  }
                />
              </UploadGate>
              {leader.contactInfo && <ContactBadge info={leader.contactInfo} gold />}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-zinc-500">
              <Trophy className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm text-center px-4">Henüz lider yok — oy ver, zirveyi belirle!</p>
            </div>
          )}
        </div>

        {/* Dünün Lider Namusu */}
        {yesterday ? (
          <div className="rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-900">
            <div className="flex items-center gap-2 px-5 py-3 bg-zinc-800 border-b border-zinc-700">
              <Trophy className="w-4 h-4 text-zinc-400" />
              <h2 className="font-semibold text-zinc-400 tracking-wide text-sm uppercase">Dünün Lider Namusu</h2>
            </div>
            <UploadGate label="Dünün şampiyonunu görmek için fotoğraf yükle">
              <AlbumViewer
                urls={[yesterday.url, ...(yesterday.albumUrls ?? [])]}
                maxHeight={320}
                dimmed
                bottomOverlay={
                  <div className="flex items-center gap-2">
                    <div className="bg-black/70 backdrop-blur rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-zinc-300 fill-zinc-300" />
                      <span className="text-white font-bold">{yesterday.average.toFixed(2)}</span>
                    </div>
                    <span className="text-zinc-400 text-xs bg-black/70 backdrop-blur rounded-lg px-2 py-1.5">{yesterday.voteCount} oy</span>
                  </div>
                }
              />
            </UploadGate>
            {yesterday.contactInfo && <ContactBadge info={yesterday.contactInfo} />}
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 flex flex-col items-center justify-center py-14 text-zinc-600">
            <Trophy className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-xs text-center px-4">Dünün şampiyonu henüz belirlenmedi</p>
          </div>
        )}
      </div>

      {/* 2.–5. sıra şeridi */}
      {runnerUps.length > 0 && (
        <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
          <div className="px-4 py-2 border-b border-zinc-800">
            <span className="text-zinc-500 text-xs font-medium uppercase tracking-wide">Sıralama</span>
          </div>
          <div className="flex gap-2 p-3">
            {runnerUps.map((photo, i) => (
              <div
                key={photo._id}
                className={`relative flex-1 rounded-xl overflow-hidden transition-all duration-500 ${
                  activeRunner === i
                    ? 'ring-2 ring-amber-400 opacity-100 scale-105'
                    : 'opacity-40 scale-100'
                }`}
                style={{ aspectRatio: '1' }}
              >
                <div className="w-full h-full" style={!uploaded ? { filter: 'blur(4px)' } : undefined}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={`${i + 2}. sıra`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" style={{ opacity: 0.18 }}>
                    {Array.from({ length: 6 }, (_, r) => (
                      <div key={r} style={{ position: 'absolute', top: `${r * 18 - 10}%`, left: '-20%', transform: 'rotate(-30deg)', whiteSpace: 'nowrap', color: '#fff', fontWeight: 900, fontSize: '7px', letterSpacing: '1px' }}>
                        ZİRVE NAMUS &nbsp; ZİRVE NAMUS &nbsp; ZİRVE NAMUS
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute bottom-1 left-1 bg-black/80 text-white text-xs font-black px-1.5 py-0.5 rounded leading-none z-10">
                  {i + 2}.
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset saati */}
      <div className="flex items-center gap-1.5 px-1">
        <Clock className="w-3 h-3 text-zinc-600 flex-shrink-0" />
        <p className="text-zinc-600 text-xs">
          Liderlik tablosu her gün gece <span className="text-zinc-500">00:00</span>&apos;da sıfırlanır ve yeni yarış başlar.
        </p>
      </div>
    </div>
  );
}
