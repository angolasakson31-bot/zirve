'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Trophy, Star, Clock } from 'lucide-react';
import AlbumViewer from '@/components/AlbumViewer';
import UploadGate from '@/components/UploadGate';
import PixelImg from '@/components/PixelImg';
import { useUploadGate } from '@/hooks/useUploadGate';
import { addWatermark } from '@/lib/cloudinaryWatermark';

function useMidnightCountdown() {
  const calc = () => {
    const TZ = 3 * 3600_000;
    const now = Date.now();
    const trNow = now + TZ;
    const msToday = trNow % 86_400_000;
    const diff = 86_400_000 - msToday;
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

interface PhotoComment {
  text: string;
  userHash: string;
  createdAt: string;
}

interface LeaderPhoto {
  _id: string;
  url: string;
  albumUrls?: string[];
  average: number;
  voteCount: number;
  championDate?: string;
  contactInfo?: string;
  comments?: PhotoComment[];
}

interface RankedPhoto {
  _id: string;
  url: string;
  average: number;
  voteCount: number;
  rank: number;
}

const CONTACT_LABEL = 'Sana ulaşmak için iletişim bilgisi';

function RankingStrip({ photos }: { photos: RankedPhoto[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef    = useRef<number>(0);
  const doubled   = [...photos, ...photos];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || photos.length < 2) return;
    let pos = 0;
    const tick = () => {
      pos += 0.5;
      if (pos >= el.scrollWidth / 2) pos = 0;
      el.scrollLeft = pos;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [photos.length]);

  if (photos.length === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
      <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
        <span className="text-zinc-500 text-xs font-medium uppercase tracking-wide">Sıralama</span>
        <span className="text-zinc-600 text-xs">{photos.length} fotoğraf</span>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-2 p-3 overflow-hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {doubled.map((photo, i) => (
          <div key={i} className="flex-none w-16 flex flex-col rounded-xl overflow-hidden">
            <div className="relative" style={{ aspectRatio: '1' }}>
              <PixelImg src={addWatermark(photo.url)} alt={`${photo.rank}. sıra`} />
              <div className={`absolute top-1 left-1 text-white text-[10px] font-black px-1 py-0.5 rounded leading-none z-10 ${
                photo.rank === 1 ? 'bg-amber-500' : 'bg-black/80'
              }`}>
                {photo.rank}.
              </div>
            </div>
            <div className="bg-zinc-800 text-center py-1 flex items-center justify-center gap-0.5">
              <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 flex-shrink-0" />
              <span className="text-[10px] text-white font-bold">{photo.average.toFixed(1)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommentFeed({ comments }: { comments: PhotoComment[] }) {
  const [page, setPage] = useState(0);

  useEffect(() => { setPage(0); }, [comments]);

  useEffect(() => {
    const pageCount = Math.ceil(comments.length / 2);
    if (pageCount <= 1) return;
    const id = setInterval(() => setPage(p => (p + 1) % pageCount), 3500);
    return () => clearInterval(id);
  }, [comments]);

  if (!comments || comments.length === 0) return null;

  const COLORS = [
    'text-amber-400', 'text-sky-400', 'text-green-400',
    'text-pink-400', 'text-violet-400', 'text-orange-400',
  ];

  function color(hash: string, id: string) {
    return COLORS[(parseInt(hash.slice(0, 2), 16) ^ parseInt(id.slice(-2), 16)) % COLORS.length];
  }

  const pageCount = Math.ceil(comments.length / 2);
  const visible = comments.slice(page * 2, page * 2 + 2);

  return (
    <div className="border-t border-zinc-800 bg-zinc-900/80 px-2 pt-1.5 pb-1.5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-zinc-600 text-[9px] font-semibold uppercase tracking-wide">Yorumlar</p>
        {pageCount > 1 && (
          <div className="flex gap-0.5 items-center">
            {Array.from({ length: pageCount }, (_, i) => (
              <span key={i} className={`rounded-full transition-all duration-300 ${i === page ? 'w-2 h-1 bg-zinc-400' : 'w-1 h-1 bg-zinc-700'}`} />
            ))}
          </div>
        )}
      </div>
      <div className="space-y-0.5 min-h-[1rem]">
        {visible.map(c => (
          <p key={c._id} className={`text-xs leading-snug ${color(c.userHash, c._id)}`}>{c.text}</p>
        ))}
      </div>
    </div>
  );
}

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
    <div className={`px-3 py-2 border-t ${gold ? 'border-amber-500/20 bg-amber-500/5' : 'border-zinc-700 bg-zinc-800/50'}`}>
      <p className={`text-xs mb-1 font-medium ${gold ? 'text-amber-400/70' : 'text-zinc-500'}`}>{CONTACT_LABEL}</p>
      <div className="flex items-center gap-1.5 flex-wrap">
        {platform && platformStyle && (
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full border ${platformStyle}`}>{platform}</span>
        )}
        <span className={`text-xs font-semibold break-all ${gold ? 'text-white' : 'text-zinc-200'}`}>{value}</span>
      </div>
    </div>
  );
}

export default function LeaderBoard() {
  const [leader, setLeader] = useState<LeaderPhoto | null>(null);
  const [yesterday, setYesterday] = useState<LeaderPhoto | null>(null);
  const [allPhotos, setAllPhotos] = useState<RankedPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const uploaded = useUploadGate();

  const fetchLeader = useCallback(async () => {
    const res = await fetch('/api/leader', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    setLeader(data.leader);
    setYesterday(data.yesterday);
    setAllPhotos(data.allPhotos ?? []);
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

  const countdown = useMidnightCountdown();

  if (loading) return <div className="animate-pulse bg-zinc-800 rounded-2xl h-64 w-full" />;

  return (
    <div className="space-y-3">
      {/* Günün + Dünün yanyana */}
      <div className="grid grid-cols-2 gap-3">

        {/* Günün Zirvesi */}
        <div className="rounded-2xl overflow-hidden border border-amber-500/30 bg-zinc-900">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 border-b border-amber-500/20">
            <Trophy className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <h2 className="font-bold text-amber-400 text-[10px] uppercase whitespace-nowrap overflow-hidden text-ellipsis">Günün Zirvesi</h2>
          </div>
          <div className="flex items-center justify-center px-3 py-1.5 bg-zinc-800/60 border-b border-zinc-700/50">
            <span className="text-amber-400 font-mono font-bold text-[10px] tabular-nums">{countdown}</span>
          </div>
          {leader ? (
            <div>
              <UploadGate mini>
                <AlbumViewer
                  urls={[leader.url, ...(leader.albumUrls ?? [])]}
                  maxHeight={280}
                  bottomOverlay={
                    <div className="flex items-center gap-1">
                      <div className="bg-black/70 backdrop-blur rounded-lg px-2 py-1 flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-white font-bold text-sm">{leader.average.toFixed(1)}</span>
                      </div>
                      <div className="bg-black/70 backdrop-blur rounded-lg px-2 py-1 text-zinc-300 text-xs">
                        {leader.voteCount} oy
                      </div>
                    </div>
                  }
                />
              </UploadGate>
              {uploaded === true && leader.contactInfo && <ContactBadge info={leader.contactInfo} gold />}
              {uploaded === true && leader.comments && leader.comments.length > 0 && (
                <CommentFeed comments={leader.comments} />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-zinc-500">
              <Trophy className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs text-center px-3">Henüz lider yok</p>
            </div>
          )}
        </div>

        {/* Dünün Zirvesi */}
        {yesterday ? (
          <div className="rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-900">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 border-b border-zinc-700">
              <Trophy className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
              <h2 className="font-semibold text-zinc-400 text-[10px] uppercase whitespace-nowrap overflow-hidden text-ellipsis">Dünün Zirvesi</h2>
            </div>
            <UploadGate mini>
              <AlbumViewer
                urls={[yesterday.url, ...(yesterday.albumUrls ?? [])]}
                maxHeight={280}
                dimmed
                bottomOverlay={
                  <div className="flex items-center gap-1">
                    <div className="bg-black/70 backdrop-blur rounded-lg px-2 py-1 flex items-center gap-1">
                      <Star className="w-3 h-3 text-zinc-300 fill-zinc-300" />
                      <span className="text-white font-bold text-sm">{yesterday.average.toFixed(1)}</span>
                    </div>
                    <span className="text-zinc-400 text-xs bg-black/70 backdrop-blur rounded-lg px-2 py-1">{yesterday.voteCount} oy</span>
                  </div>
                }
              />
            </UploadGate>
            {uploaded === true && yesterday.contactInfo && <ContactBadge info={yesterday.contactInfo} />}
            {uploaded === true && yesterday.comments && yesterday.comments.length > 0 && (
              <CommentFeed comments={yesterday.comments} />
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 flex flex-col items-center justify-center py-10 text-zinc-600">
            <Trophy className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-xs text-center px-3">Dünkü şampiyon bekleniyor</p>
          </div>
        )}
      </div>

      {/* Fotoğraf yükle notu (kilitli için) */}
      {uploaded === false && (
        <p className="text-center text-zinc-600 text-xs">
          Günün ve dünün liderini görmek için{' '}
          <a href="#upload-form" className="text-amber-500 font-medium hover:underline">fotoğraf yükle</a>
        </p>
      )}

      <RankingStrip photos={allPhotos.filter(p => p.rank !== 1)} />

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
