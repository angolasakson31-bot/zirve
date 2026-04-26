'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Trash2, Ban, Eye, Lock, RefreshCw, CheckCircle, Trophy, Archive, Download, ImagePlus, X } from 'lucide-react';
import Image from 'next/image';

interface AdminComment {
  _id: string;
  text: string;
  userHash: string;
  createdAt: string;
}

interface AdminPhoto {
  _id: string;
  url: string;
  albumUrls?: string[];
  uploaderIp: string;
  average: number;
  voteCount: number;
  totalScore: number;
  isChampion: boolean;
  isArchived: boolean;
  createdAt: string;
  trackingCode: string;
  contactInfo?: string;
  championDate?: string;
  comments?: AdminComment[];
}

const LEADER_THRESHOLD = 3;

function computeRanks(photos: AdminPhoto[]): Map<string, number> {
  const sorted = [...photos].sort((a, b) => {
    const sa = a.voteCount >= LEADER_THRESHOLD ? (a.totalScore / a.voteCount) : -1;
    const sb = b.voteCount >= LEADER_THRESHOLD ? (b.totalScore / b.voteCount) : -1;
    return sb - sa;
  });
  const map = new Map<string, number>();
  sorted.forEach((p, i) => map.set(p._id, i + 1));
  return map;
}

interface PhotoGroup {
  dateLabel: string;
  dateKey: string;
  isToday: boolean;
  photos: AdminPhoto[];
}

const SESSION_KEY = 'zirve_admin_pw';

const TR_OFFSET_MS = 3 * 60 * 60 * 1000;

function toTrDateStr(date: Date): string {
  return new Date(date.getTime() + TR_OFFSET_MS).toISOString().slice(0, 10);
}

function todayStr() {
  return toTrDateStr(new Date());
}

function groupPhotosByDate(photos: AdminPhoto[]): PhotoGroup[] {
  const today = todayStr();
  const map = new Map<string, AdminPhoto[]>();

  for (const p of photos) {
    const key = toTrDateStr(new Date(p.createdAt));
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }

  const groups: PhotoGroup[] = [];
  for (const [key, list] of map.entries()) {
    const isToday = key === today;
    const d = new Date(key);
    const dateLabel = isToday
      ? `Bugün — ${d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`
      : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    groups.push({ dateKey: key, dateLabel, isToday, photos: list });
  }

  groups.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  return groups;
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [banningIps, setBanningIps] = useState<Set<string>>(new Set());
  const [recalcing, setRecalcing] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadContact, setUploadContact] = useState('');
  const [uploading, setUploading] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const headers = useCallback((pw: string) => ({
    'Content-Type': 'application/json',
    'x-admin-password': pw,
  }), []);

  const fetchPhotos = useCallback(async (pw: string) => {
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/photos', { headers: { 'x-admin-password': pw } });
    if (res.status === 401) { setError('Şifre yanlış.'); setAuthed(false); setLoading(false); return; }
    const data = await res.json();
    setPhotos(data.photos ?? []);
    setLoading(false);
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/photos', { headers: { 'x-admin-password': password } });
    if (res.status === 401) { setError('Şifre yanlış.'); return; }
    sessionStorage.setItem(SESSION_KEY, password);
    setAuthed(true);
    const data = await res.json();
    setPhotos(data.photos ?? []);
  };

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) { setPassword(saved); setAuthed(true); fetchPhotos(saved); }
  }, [fetchPhotos]);

  const deletePhoto = async (photo: AdminPhoto) => {
    if (!confirm('Bu fotoğrafı silmek istiyor musun?')) return;
    setDeletingIds(s => new Set(s).add(photo._id));
    const res = await fetch(`/api/admin/photos/${photo._id}`, {
      method: 'DELETE', headers: headers(password),
    });
    if (res.ok) {
      setPhotos(p => p.filter(x => x._id !== photo._id));
      showToast('Fotoğraf silindi.');
    } else showToast('Silme başarısız.');
    setDeletingIds(s => { const n = new Set(s); n.delete(photo._id); return n; });
  };

  const adminUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', uploadFile);
    form.append('contactInfo', uploadContact.trim() || 'Admin');
    const res = await fetch('/api/admin/upload', { method: 'POST', headers: { 'x-admin-password': password }, body: form });
    const data = await res.json();
    if (res.ok) {
      showToast(`Yüklendi! Kod: ${data.trackingCode}`);
      setUploadFile(null);
      setUploadPreview(null);
      setUploadContact('');
      fetchPhotos(password);
    } else {
      showToast(data.error || 'Yükleme başarısız.');
    }
    setUploading(false);
  };

  const adminVote = async (photoId: string, score: number) => {
    setVotingId(photoId);
    const res = await fetch('/api/admin/vote', {
      method: 'POST', headers: headers(password), body: JSON.stringify({ photoId, score }),
    });
    const data = await res.json();
    if (res.ok) {
      setPhotos(prev => prev.map(p =>
        p._id === photoId
          ? { ...p, average: data.photo.average, voteCount: data.photo.voteCount }
          : p
      ));
      if (data.leaderChanged) showToast('Yeni lider belirlendi!');
    } else {
      showToast(data.error || 'Oy verilemedi.');
    }
    setVotingId(null);
  };

  const recalcLeader = async () => {
    setRecalcing(true);
    const res = await fetch('/api/admin/recalc-leader', { method: 'POST', headers: headers(password) });
    const data = await res.json();
    if (res.ok) {
      showToast(data.champion ? 'Lider yeniden hesaplandı.' : 'Uygun fotoğraf bulunamadı.');
      fetchPhotos(password);
    } else showToast('Hata oluştu.');
    setRecalcing(false);
  };

  const downloadPhoto = (url: string, code: string) => {
    // Insert fl_attachment into Cloudinary URL to force browser download
    const downloadUrl = url.replace('/upload/', '/upload/fl_attachment/');
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `zirve-${code}`;
    a.target = '_blank';
    a.click();
  };

  const banIp = async (ip: string) => {
    if (!confirm(`${ip} adresini engellemek istiyor musun?`)) return;
    setBanningIps(s => new Set(s).add(ip));
    const res = await fetch('/api/admin/ban', {
      method: 'POST', headers: headers(password), body: JSON.stringify({ ip }),
    });
    if (res.ok) showToast(`${ip} engellendi.`);
    else showToast('Engelleme başarısız.');
    setBanningIps(s => { const n = new Set(s); n.delete(ip); return n; });
  };

  const deleteComment = async (photoId: string, commentId: string) => {
    const res = await fetch(`/api/admin/photos/${photoId}/comment`, {
      method: 'DELETE',
      headers: headers(password),
      body: JSON.stringify({ commentId }),
    });
    if (res.ok) {
      setPhotos(prev => prev.map(p =>
        p._id === photoId
          ? { ...p, comments: (p.comments ?? []).filter(c => c._id !== commentId) }
          : p
      ));
      showToast('Yorum silindi.');
    } else showToast('Yorum silinemedi.');
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <form onSubmit={login} className="w-full max-w-sm bg-zinc-900 rounded-2xl border border-zinc-700 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-amber-400" />
            <h1 className="text-white font-bold">Yönetici Paneli</h1>
          </div>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Şifre" autoFocus
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/50"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold py-2.5 rounded-xl transition text-sm">
            Giriş
          </button>
        </form>
      </div>
    );
  }

  const groups = groupPhotosByDate(photos);

  const todayPhotos = groups.find(g => g.isToday)?.photos ?? [];
  const top5 = [...todayPhotos]
    .sort((a, b) => {
      const sa = a.voteCount >= LEADER_THRESHOLD ? (a.totalScore / a.voteCount) : -1;
      const sb = b.voteCount >= LEADER_THRESHOLD ? (b.totalScore / b.voteCount) : -1;
      return sb - sa;
    })
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-zinc-800 border border-zinc-600 rounded-xl px-4 py-3 text-sm shadow-xl">
          <CheckCircle className="w-4 h-4 text-green-400" /> {toast}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold">Yönetici Paneli</h1>
            <span className="text-zinc-500 text-sm ml-2">({photos.length} fotoğraf)</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={recalcLeader} disabled={recalcing}
              className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition disabled:opacity-40">
              <Trophy className={`w-4 h-4 ${recalcing ? 'animate-pulse' : ''}`} /> Lideri Hesapla
            </button>
            <button onClick={() => fetchPhotos(password)} disabled={loading}
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition disabled:opacity-40">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Yenile
            </button>
          </div>
        </div>

        {/* Bugünün Top 5 */}
        {top5.length > 0 && (
          <div className="mb-8 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-amber-500/5 border-b border-amber-500/20">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-amber-400 uppercase tracking-wide">Bugünün Sıralaması</span>
            </div>
            <div className="divide-y divide-zinc-800">
              {top5.map((photo, i) => (
                <div key={photo._id} className={`flex items-center gap-3 px-4 py-3 ${photo.isChampion ? 'bg-amber-500/5' : ''}`}>
                  <span className={`text-lg font-black w-7 text-center flex-shrink-0 ${i === 0 ? 'text-amber-400' : 'text-zinc-500'}`}>{i + 1}.</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.trackingCode} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 cursor-zoom-in" onClick={() => setLightbox(photo.url)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{photo.average.toFixed(2)}</span>
                      <span className="text-zinc-500 text-xs">{photo.voteCount} oy</span>
                      {photo.isChampion && <span className="text-xs bg-amber-400 text-black font-bold px-1.5 py-0.5 rounded-full">Lider</span>}
                    </div>
                    <div className="text-zinc-600 text-xs font-mono truncate">{photo.trackingCode}</div>
                  </div>
                  {photo.contactInfo && (
                    <span className="text-xs text-amber-400/80 bg-amber-500/10 rounded-lg px-2 py-1 max-w-[120px] truncate flex-shrink-0">{photo.contactInfo}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Fotoğraf Ekle */}
        <div className="mb-8 bg-zinc-900 border border-zinc-700 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <ImagePlus className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-400">Bugüne Fotoğraf Ekle</span>
          </div>
          <input ref={uploadInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (!f) return;
              setUploadFile(f);
              setUploadPreview(URL.createObjectURL(f));
              e.target.value = '';
            }} />
          {!uploadPreview ? (
            <button onClick={() => uploadInputRef.current?.click()}
              className="w-full border-2 border-dashed border-zinc-700 hover:border-amber-500/50 rounded-xl py-8 flex flex-col items-center gap-2 text-zinc-500 hover:text-zinc-300 transition">
              <ImagePlus className="w-8 h-8" />
              <span className="text-sm">Fotoğraf seç</span>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="relative w-full max-w-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={uploadPreview} alt="Önizleme" className="rounded-xl object-cover w-full max-h-48" />
                <button onClick={() => { setUploadFile(null); setUploadPreview(null); }}
                  className="absolute top-2 right-2 bg-black/70 hover:bg-black rounded-full p-1">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <input type="text" value={uploadContact} onChange={e => setUploadContact(e.target.value)}
                placeholder="İletişim bilgisi (opsiyonel)"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-amber-500/50" />
              <button onClick={adminUpload} disabled={uploading}
                className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-bold px-5 py-2 rounded-xl text-sm transition">
                {uploading ? <><span className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full inline-block" /> Yükleniyor...</> : <><ImagePlus className="w-4 h-4" /> Yükle</>}
              </button>
            </div>
          )}
        </div>

        {loading && photos.length === 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-zinc-800 rounded-xl aspect-square" />
            ))}
          </div>
        )}

        {groups.map(group => (
          <div key={group.dateKey} className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              {group.isToday ? (
                <span className="text-amber-400 font-bold text-sm uppercase tracking-wide">{group.dateLabel}</span>
              ) : (
                <>
                  <Archive className="w-4 h-4 text-zinc-500" />
                  <span className="text-zinc-500 font-semibold text-sm">{group.dateLabel}</span>
                </>
              )}
              <span className="text-zinc-600 text-xs">— {group.photos.length} fotoğraf</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(() => {
                const ranks = computeRanks(group.photos);
                const total = group.photos.length;
                return group.photos.map(photo => {
                const isDayChampion = group.isToday ? photo.isChampion : photo.championDate === group.dateKey;
                const rank = ranks.get(photo._id) ?? 0;
                return (
                <div key={photo._id} className={`bg-zinc-900 rounded-xl border overflow-hidden ${isDayChampion ? 'border-amber-500/60' : photo.isArchived ? 'border-zinc-800/50 opacity-75' : 'border-zinc-800'}`}>
                  <div className="relative aspect-square bg-zinc-800 cursor-zoom-in" onClick={() => setLightbox(photo.url)}>
                    <Image src={photo.url} alt={photo.trackingCode} fill className="object-cover" unoptimized />
                    {isDayChampion && (
                      <div className="absolute top-1.5 left-1.5 bg-amber-400 text-black text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> Günün Şampiyonu
                      </div>
                    )}
                    {photo.isArchived && (
                      <div className="absolute top-1.5 right-1.5 bg-zinc-700/90 text-zinc-300 text-xs px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Archive className="w-3 h-3" /> Arşiv
                      </div>
                    )}
                    {photo.albumUrls && photo.albumUrls.length > 0 && (
                      <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                        <span>+{photo.albumUrls.length}</span>
                      </div>
                    )}
                  </div>
                  {photo.albumUrls && photo.albumUrls.length > 0 && (
                    <div className="flex gap-1 px-2 py-1.5 bg-zinc-950/60 overflow-x-auto">
                      {photo.albumUrls.map((url, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={url} alt={`Albüm ${i + 1}`}
                          onClick={() => setLightbox(url)}
                          className="w-12 h-12 object-cover rounded cursor-zoom-in flex-shrink-0 opacity-70 hover:opacity-100 transition"
                        />
                      ))}
                    </div>
                  )}
                  <div className="p-3 space-y-2">
                    <div className="text-xs text-zinc-500 font-mono">{photo.trackingCode}</div>
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>⭐ {photo.average.toFixed(1)}</span>
                      <span>{photo.voteCount} oy</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${rank === 1 ? 'text-amber-400' : 'text-zinc-300'}`}>{rank}. sıra</span>
                      <span className="text-zinc-600">/ {total} fotoğraf</span>
                    </div>
                    <div className="text-xs text-zinc-600 font-mono truncate">{photo.uploaderIp}</div>
                    {photo.contactInfo && (
                      <div className="text-xs text-amber-400/80 bg-amber-500/10 rounded-lg px-2 py-1.5 break-all">
                        {photo.contactInfo}
                      </div>
                    )}
                    {photo.comments && photo.comments.length > 0 && (
                      <div className="border border-zinc-800 rounded-lg p-2 space-y-1">
                        <p className="text-zinc-600 text-xs mb-1">Yorumlar ({photo.comments.length})</p>
                        {photo.comments.map(c => (
                          <div key={c._id} className="flex items-start gap-1.5">
                            <span className="text-zinc-300 text-xs flex-1 break-all leading-snug">{c.text}</span>
                            <button
                              onClick={() => deleteComment(photo._id, c._id)}
                              className="flex-shrink-0 text-red-500/50 hover:text-red-400 transition-colors mt-0.5">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Admin puan butonları */}
                    <div className="pt-1">
                      <p className="text-zinc-600 text-xs mb-1">Puan ver</p>
                      <div className="grid grid-cols-5 gap-1">
                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                          <button key={n}
                            onClick={() => adminVote(photo._id, n)}
                            disabled={votingId === photo._id}
                            className={`py-1 rounded-lg text-xs font-bold transition disabled:opacity-40 ${
                              n >= 6 ? 'bg-amber-500/20 hover:bg-amber-500/40 text-amber-400' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                            }`}
                          >{n}</button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => downloadPhoto(photo.url, photo.trackingCode)}
                        className="flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg py-1.5 px-2 text-zinc-300 text-xs transition"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deletePhoto(photo)}
                        disabled={deletingIds.has(photo._id)}
                        className="flex-1 flex items-center justify-center gap-1 bg-red-950/50 hover:bg-red-900/60 border border-red-900/50 rounded-lg py-1.5 text-red-400 text-xs transition disabled:opacity-40"
                      >
                        <Trash2 className="w-3 h-3" /> Sil
                      </button>
                      <button
                        onClick={() => banIp(photo.uploaderIp)}
                        disabled={banningIps.has(photo.uploaderIp)}
                        className="flex-1 flex items-center justify-center gap-1 bg-orange-950/50 hover:bg-orange-900/60 border border-orange-900/50 rounded-lg py-1.5 text-orange-400 text-xs transition disabled:opacity-40"
                      >
                        <Ban className="w-3 h-3" /> Engelle
                      </button>
                    </div>
                  </div>
                </div>
              );
              });
              })()}
            </div>
          </div>
        ))}

        {!loading && photos.length === 0 && (
          <p className="text-center text-zinc-600 py-20">Henüz fotoğraf yok.</p>
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Tam boyut" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}
