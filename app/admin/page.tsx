'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Trash2, Ban, Eye, EyeOff, Lock, RefreshCw, CheckCircle, Trophy, Archive, Download, ImagePlus, X, ShieldOff, Flag, ShieldCheck } from 'lucide-react';
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
  isHidden?: boolean;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  trackingCode: string;
  contactInfo?: string;
  championDate?: string;
  comments?: AdminComment[];
}

interface BannedEntry {
  ip: string;
  reason: string;
  createdAt: string;
  photoUrl?: string | null;
}

interface AdminReport {
  _id: string;
  photoId: string;
  reason: 'ncii' | 'minor' | 'insult' | 'copyright' | 'personal_data' | 'other';
  details: string;
  createdAt: string;
  photo: {
    _id: string;
    url: string;
    trackingCode: string;
    reportCount: number;
    isHidden: boolean;
    moderationStatus: string;
  } | null;
}

interface AdminKvkkRequest {
  _id: string;
  name: string;
  email: string;
  requestType: 'access' | 'delete' | 'correct' | 'object' | 'other';
  details: string;
  trackingCode: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
}

const REPORT_REASON_LABEL: Record<AdminReport['reason'], string> = {
  ncii:          'Rıza dışı mahrem içerik',
  minor:         '18 yaşından küçük',
  insult:        'Hakaret / iftira',
  copyright:     'Telif hakkı',
  personal_data: 'Kişisel veri ifşası',
  other:         'Diğer',
};

const KVKK_TYPE_LABEL: Record<AdminKvkkRequest['requestType'], string> = {
  access:  'Bilgi talebi',
  delete:  'Silme talebi',
  correct: 'Düzeltme talebi',
  object:  'İşlemeye itiraz',
  other:   'Diğer',
};

const REASONS = ['Uygunsuz fotoğraf', 'Yanlış iletişim bilgisi'] as const;
type Reason = typeof REASONS[number];

const LEADER_THRESHOLD = 3;

function computeRanks(photos: AdminPhoto[]): Map<string, number> {
  const sorted = [...photos].sort((a, b) => {
    if (a.isChampion && !b.isChampion) return -1;
    if (!a.isChampion && b.isChampion) return 1;
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
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [commentingIds, setCommentingIds] = useState<Set<string>>(new Set());
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);
  const [uploadContact, setUploadContact] = useState('');
  const [uploading, setUploading] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [bannedIps, setBannedIps] = useState<BannedEntry[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [kvkkRequests, setKvkkRequests] = useState<AdminKvkkRequest[]>([]);
  const [preModEnabled, setPreModEnabled] = useState<boolean | null>(null);
  const [preModBusy, setPreModBusy] = useState(false);
  const [reportThreshold, setReportThreshold] = useState<number>(10);
  const [reportThresholdInput, setReportThresholdInput] = useState<string>('10');
  const [reportThresholdBusy, setReportThresholdBusy] = useState(false);
  const [actionModal, setActionModal] = useState<{ type: 'delete' | 'ban'; photo: AdminPhoto; reason: Reason } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  const fetchBannedIps = useCallback(async (pw: string) => {
    const res = await fetch('/api/admin/ban', { headers: { 'x-admin-password': pw } });
    if (res.ok) {
      const data = await res.json();
      setBannedIps(data.bans ?? []);
    }
  }, []);

  const fetchReports = useCallback(async (pw: string) => {
    const res = await fetch('/api/admin/reports', { headers: { 'x-admin-password': pw } });
    if (res.ok) {
      const data = await res.json();
      setReports(data.reports ?? []);
    }
  }, []);

  const fetchKvkkRequests = useCallback(async (pw: string) => {
    const res = await fetch('/api/admin/kvkk', { headers: { 'x-admin-password': pw } });
    if (res.ok) {
      const data = await res.json();
      setKvkkRequests(data.requests ?? []);
    }
  }, []);

  const fetchPreModStatus = useCallback(async (pw: string) => {
    const res = await fetch('/api/admin/pre-moderation', { headers: { 'x-admin-password': pw } });
    if (res.ok) {
      const data = await res.json();
      setPreModEnabled(Boolean(data.enabled));
    }
  }, []);

  const fetchReportThreshold = useCallback(async (pw: string) => {
    const res = await fetch('/api/admin/report-threshold', { headers: { 'x-admin-password': pw } });
    if (res.ok) {
      const data = await res.json();
      const v = Number(data.threshold);
      if (Number.isFinite(v)) {
        setReportThreshold(v);
        setReportThresholdInput(String(v));
      }
    }
  }, []);

  const saveReportThreshold = async () => {
    const v = parseInt(reportThresholdInput, 10);
    if (!Number.isFinite(v) || v < 1 || v > 100) {
      showToast('Eşik 1 ile 100 arasında olmalı.');
      setReportThresholdInput(String(reportThreshold));
      return;
    }
    setReportThresholdBusy(true);
    const res = await fetch('/api/admin/report-threshold', {
      method: 'POST',
      headers: headers(password),
      body: JSON.stringify({ threshold: v }),
    });
    if (res.ok) {
      const data = await res.json();
      const saved = Number(data.threshold);
      setReportThreshold(saved);
      setReportThresholdInput(String(saved));
      showToast(`Şikâyet eşiği: ${saved} olarak ayarlandı.`);
    } else {
      showToast('Eşik güncellenemedi.');
    }
    setReportThresholdBusy(false);
  };

  const hidePhoto = async (photoId: string) => {
    const res = await fetch('/api/admin/hide', {
      method: 'POST',
      headers: headers(password),
      body: JSON.stringify({ photoId }),
    });
    if (res.ok) {
      showToast('Fotoğraf gizlendi.');
      fetchPhotos(password);
    } else {
      showToast('Gizleme başarısız.');
    }
  };

  const togglePreMod = async () => {
    if (preModEnabled === null) return;
    setPreModBusy(true);
    const target = !preModEnabled;
    const res = await fetch('/api/admin/pre-moderation', {
      method: 'POST',
      headers: headers(password),
      body: JSON.stringify({ enabled: target }),
    });
    if (res.ok) {
      setPreModEnabled(target);
      showToast(target ? 'Pre-moderation AÇIK: yeni yüklemeler onayınıza düşecek.' : 'Pre-moderation KAPALI: yüklemeler otomatik yayına çıkacak.');
    } else {
      showToast('Toggle başarısız.');
    }
    setPreModBusy(false);
  };

  const approvePending = async (photoId: string) => {
    const res = await fetch('/api/admin/moderate', {
      method: 'POST',
      headers: headers(password),
      body: JSON.stringify({ photoId, action: 'approve' }),
    });
    if (res.ok) {
      showToast('Fotoğraf onaylandı, yayına alındı.');
      fetchPhotos(password);
    } else {
      showToast('Onaylama başarısız.');
    }
  };

  const rejectPending = async (photoId: string) => {
    const res = await fetch('/api/admin/moderate', {
      method: 'POST',
      headers: headers(password),
      body: JSON.stringify({ photoId, action: 'reject', reason: 'Onay reddedildi' }),
    });
    if (res.ok) {
      showToast('Fotoğraf reddedildi ve silindi.');
      fetchPhotos(password);
    } else {
      showToast('Reddetme başarısız.');
    }
  };

  const forceUnhide = async (photoId: string) => {
    const res = await fetch('/api/admin/unhide', {
      method: 'POST',
      headers: headers(password),
      body: JSON.stringify({ photoId }),
    });
    if (res.ok) {
      showToast('Fotoğraf yeniden yayında.');
      fetchPhotos(password);
      fetchReports(password);
    } else {
      showToast('Açma başarısız.');
    }
  };

  const handleReportAction = async (photoId: string, action: 'hide' | 'unhide' | 'resolve' | 'dismiss') => {
    const res = await fetch('/api/admin/reports', {
      method: 'POST',
      headers: headers(password),
      body: JSON.stringify({ photoId, action }),
    });
    if (res.ok) {
      const label =
        action === 'hide' ? 'Fotoğraf gizlendi.' :
        action === 'unhide' ? 'Fotoğraf yeniden açıldı.' :
        action === 'resolve' ? 'Şikâyetler çözüldü işaretlendi.' :
        'Şikâyetler geçersiz sayıldı.';
      showToast(label);
      fetchReports(password);
      fetchPhotos(password);
    } else {
      showToast('İşlem başarısız.');
    }
  };

  const handleKvkkAction = async (requestId: string, status: 'in_progress' | 'resolved') => {
    const res = await fetch('/api/admin/kvkk', {
      method: 'POST',
      headers: headers(password),
      body: JSON.stringify({ requestId, status }),
    });
    if (res.ok) {
      showToast(status === 'resolved' ? 'Talep çözüldü.' : 'Talep işleme alındı.');
      fetchKvkkRequests(password);
    } else {
      showToast('İşlem başarısız.');
    }
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/photos', { headers: { 'x-admin-password': password } });
    if (res.status === 401) { setError('Şifre yanlış.'); return; }
    setAuthed(true);
    const data = await res.json();
    setPhotos(data.photos ?? []);
    fetchBannedIps(password);
    fetchReports(password);
    fetchKvkkRequests(password);
    fetchPreModStatus(password);
    fetchReportThreshold(password);
  };

  useEffect(() => {
    // Şifre artık sessionStorage'a kaydedilmiyor — XSS koruması
  }, [fetchPhotos]);

  const confirmAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    const { type, photo, reason } = actionModal;
    if (type === 'delete') {
      setDeletingIds(s => new Set(s).add(photo._id));
      const res = await fetch(`/api/admin/photos/${photo._id}`, {
        method: 'DELETE', headers: headers(password), body: JSON.stringify({ reason }),
      });
      if (res.ok) { setPhotos(p => p.filter(x => x._id !== photo._id)); showToast('Fotoğraf silindi.'); }
      else showToast('Silme başarısız.');
      setDeletingIds(s => { const n = new Set(s); n.delete(photo._id); return n; });
    } else {
      setBanningIps(s => new Set(s).add(photo.uploaderIp));
      const res = await fetch('/api/admin/ban', {
        method: 'POST', headers: headers(password), body: JSON.stringify({ ip: photo.uploaderIp, reason }),
      });
      if (res.ok) { showToast(`${photo.uploaderIp} engellendi.`); fetchBannedIps(password); }
      else showToast('Engelleme başarısız.');
      setBanningIps(s => { const n = new Set(s); n.delete(photo.uploaderIp); return n; });
    }
    setActionModal(null);
    setActionLoading(false);
  };

  const unbanIp = async (ip: string) => {
    const res = await fetch('/api/admin/ban', {
      method: 'DELETE', headers: headers(password), body: JSON.stringify({ ip }),
    });
    if (res.ok) { setBannedIps(prev => prev.filter(b => b.ip !== ip)); showToast('Engel kaldırıldı.'); }
    else showToast('Engel kaldırılamadı.');
  };

  const adminUpload = async () => {
    if (!uploadFiles.length) return;
    setUploading(true);
    const form = new FormData();
    uploadFiles.forEach(f => form.append('files', f));
    form.append('contactInfo', uploadContact.trim() || 'Admin');
    const res = await fetch('/api/admin/upload', { method: 'POST', headers: { 'x-admin-password': password }, body: form });
    const data = await res.json();
    if (res.ok) {
      showToast(`Yüklendi! Kod: ${data.trackingCode}`);
      setUploadFiles([]);
      setUploadPreviews([]);
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

  const setChampionDirect = async (photoId: string, unset = false) => {
    const res = await fetch('/api/admin/set-champion', {
      method: 'POST',
      headers: headers(password),
      body: JSON.stringify({ photoId, unset }),
    });
    if (res.ok) {
      showToast(unset ? 'Şampiyonluk kaldırıldı.' : 'Şampiyon olarak ayarlandı.');
      fetchPhotos(password);
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error ?? 'İşlem başarısız.');
    }
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


  const addComment = async (photoId: string) => {
    const text = (commentTexts[photoId] ?? '').trim();
    if (!text) return;
    setCommentingIds(s => new Set(s).add(photoId));
    const res = await fetch(`/api/admin/photos/${photoId}/comment`, {
      method: 'POST',
      headers: headers(password),
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (res.ok) {
      setPhotos(prev => prev.map(p =>
        p._id === photoId ? { ...p, comments: data.comments } : p
      ));
      setCommentTexts(prev => ({ ...prev, [photoId]: '' }));
      showToast('Yorum eklendi.');
    } else {
      showToast(data.error || 'Yorum eklenemedi.');
    }
    setCommentingIds(s => { const n = new Set(s); n.delete(photoId); return n; });
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
      if (a.isChampion && !b.isChampion) return -1;
      if (!a.isChampion && b.isChampion) return 1;
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
          <div className="flex items-center gap-3 flex-wrap">
            {preModEnabled !== null && (
              <button
                onClick={togglePreMod}
                disabled={preModBusy}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-bold transition disabled:opacity-40 ${
                  preModEnabled
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700'
                }`}
                title={preModEnabled
                  ? 'AÇIK — yeni yüklemeler önce admin onayına düşer'
                  : 'KAPALI — yeni yüklemeler otomatik yayına çıkar'}
              >
                <ShieldCheck className="w-4 h-4" />
                Pre-Mod: {preModEnabled ? 'AÇIK' : 'KAPALI'}
              </button>
            )}
            <div
              className="flex items-center gap-1.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1"
              title="Bir fotoğrafa kaç şikâyet gelince otomatik gizlensin (1-100)"
            >
              <Flag className="w-4 h-4 text-red-400" />
              <span className="text-zinc-400 text-xs">Eşik:</span>
              <input
                type="number"
                min={1}
                max={100}
                value={reportThresholdInput}
                onChange={e => setReportThresholdInput(e.target.value)}
                className="w-12 bg-transparent border-b border-zinc-700 text-zinc-200 text-sm font-bold text-center focus:outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                onClick={saveReportThreshold}
                disabled={reportThresholdBusy || parseInt(reportThresholdInput, 10) === reportThreshold}
                className="text-xs text-amber-400 hover:text-amber-300 disabled:text-zinc-600 disabled:cursor-not-allowed transition"
              >
                {reportThresholdBusy ? '...' : 'Kaydet'}
              </button>
            </div>
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
                  <img src={photo.url} alt={photo.trackingCode} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 cursor-zoom-in" style={{ pointerEvents: 'auto' }} onClick={() => setLightbox(photo.url)} />
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

        {/* Engellenen IP Listesi */}
        {bannedIps.length > 0 && (
          <div className="mb-8 bg-zinc-900 border border-red-900/30 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-red-500/5 border-b border-red-900/30">
              <Ban className="w-4 h-4 text-red-400" />
              <span className="text-sm font-bold text-red-400 uppercase tracking-wide">Engellenenler</span>
              <span className="text-zinc-600 text-xs ml-auto">{bannedIps.length} IP</span>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {bannedIps.map(b => (
                <div key={b.ip} className="flex items-center gap-3 px-4 py-2.5">
                  {b.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.photoUrl} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0 opacity-70" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-zinc-300 text-xs font-mono">{b.ip.slice(0, 12)}…</span>
                    {b.reason && <span className="ml-2 text-zinc-500 text-xs">— {b.reason}</span>}
                  </div>
                  <button
                    onClick={() => unbanIp(b.ip)}
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-green-400 transition px-2 py-1 rounded-lg hover:bg-green-500/10"
                  >
                    <ShieldOff className="w-3.5 h-3.5" /> Kaldır
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bekleyen Onaylar (pre-moderation) */}
        {(() => {
          const pending = photos.filter(p => p.moderationStatus === 'pending');
          if (pending.length === 0) return null;
          return (
            <div className="mb-8 bg-zinc-900 border border-emerald-900/30 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 bg-emerald-500/5 border-b border-emerald-900/30">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-400 uppercase tracking-wide">Bekleyen Onaylar</span>
                <span className="text-zinc-600 text-xs ml-auto">{pending.length}</span>
              </div>
              <div className="divide-y divide-zinc-800/50">
                {pending.map(p => (
                  <div key={p._id} className="flex items-start gap-3 px-4 py-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt={p.trackingCode}
                      onClick={() => setLightbox(p.url)}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0 cursor-zoom-in"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-zinc-300 text-xs font-mono">{p.trackingCode}</span>
                        {p.albumUrls && p.albumUrls.length > 0 && (
                          <span className="text-zinc-500 text-[10px]">+{p.albumUrls.length} albüm</span>
                        )}
                      </div>
                      {p.contactInfo && (
                        <p className="text-amber-400/80 text-xs bg-amber-500/10 rounded-lg px-2 py-1 inline-block max-w-full truncate">
                          {p.contactInfo}
                        </p>
                      )}
                      <p className="text-zinc-600 text-[10px] mt-1">
                        {new Date(p.createdAt).toLocaleString('tr-TR')} · {p.uploaderIp.slice(0, 10)}…
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button
                        onClick={() => approvePending(p._id)}
                        className="flex items-center gap-1 text-xs text-emerald-400 hover:bg-emerald-500/10 px-2 py-1 rounded-lg transition"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Onayla
                      </button>
                      <button
                        onClick={() => rejectPending(p._id)}
                        className="flex items-center gap-1 text-xs text-red-400 hover:bg-red-500/10 px-2 py-1 rounded-lg transition"
                      >
                        <X className="w-3.5 h-3.5" /> Reddet
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Bekleyen Şikâyetler */}
        {reports.length > 0 && (
          <div className="mb-8 bg-zinc-900 border border-red-900/30 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-red-500/5 border-b border-red-900/30">
              <Flag className="w-4 h-4 text-red-400" />
              <span className="text-sm font-bold text-red-400 uppercase tracking-wide">Bekleyen Şikâyetler</span>
              <span className="text-zinc-600 text-xs ml-auto">{reports.length}</span>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {reports.map(r => (
                <div key={r._id} className="flex items-start gap-3 px-4 py-3">
                  {r.photo?.url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={r.photo.url}
                      alt=""
                      onClick={() => r.photo?.url && setLightbox(r.photo.url)}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0 cursor-zoom-in"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-600 text-xs flex-shrink-0">
                      yok
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-red-300 text-xs font-semibold bg-red-500/10 border border-red-500/30 rounded-full px-2 py-0.5">
                        {REPORT_REASON_LABEL[r.reason]}
                      </span>
                      {r.photo?.trackingCode && (
                        <span className="text-zinc-500 text-xs font-mono">{r.photo.trackingCode}</span>
                      )}
                      {r.photo && (
                        <span className="text-zinc-600 text-xs">
                          {r.photo.reportCount} şikâyet
                          {r.photo.isHidden && <span className="text-amber-400 ml-1">· gizli</span>}
                        </span>
                      )}
                    </div>
                    {r.details && (
                      <p className="text-zinc-400 text-xs leading-snug break-words">{r.details}</p>
                    )}
                    <p className="text-zinc-600 text-[10px] mt-1">
                      {new Date(r.createdAt).toLocaleString('tr-TR')}
                    </p>
                  </div>
                  {r.photo && (
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      {r.photo.isHidden ? (
                        <button
                          onClick={() => handleReportAction(r.photoId, 'unhide')}
                          className="flex items-center gap-1 text-xs text-emerald-400 hover:bg-emerald-500/10 px-2 py-1 rounded-lg transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> Aç
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReportAction(r.photoId, 'hide')}
                          className="flex items-center gap-1 text-xs text-amber-400 hover:bg-amber-500/10 px-2 py-1 rounded-lg transition"
                        >
                          <EyeOff className="w-3.5 h-3.5" /> Gizle
                        </button>
                      )}
                      <button
                        onClick={() => handleReportAction(r.photoId, 'resolve')}
                        className="flex items-center gap-1 text-xs text-zinc-300 hover:bg-zinc-700 px-2 py-1 rounded-lg transition"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Tamam
                      </button>
                      <button
                        onClick={() => handleReportAction(r.photoId, 'dismiss')}
                        className="flex items-center gap-1 text-xs text-zinc-500 hover:bg-zinc-700 px-2 py-1 rounded-lg transition"
                      >
                        <X className="w-3.5 h-3.5" /> Geçersiz
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KVKK Talepleri */}
        {kvkkRequests.length > 0 && (
          <div className="mb-8 bg-zinc-900 border border-sky-900/30 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-sky-500/5 border-b border-sky-900/30">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span className="text-sm font-bold text-sky-400 uppercase tracking-wide">KVKK Talepleri</span>
              <span className="text-zinc-600 text-xs ml-auto">{kvkkRequests.length}</span>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {kvkkRequests.map(k => (
                <div key={k._id} className="px-4 py-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sky-300 text-xs font-semibold bg-sky-500/10 border border-sky-500/30 rounded-full px-2 py-0.5">
                      {KVKK_TYPE_LABEL[k.requestType]}
                    </span>
                    <span className="text-zinc-300 text-sm font-medium">{k.name}</span>
                    <a
                      href={`mailto:${k.email}?subject=KVKK%20Başvurunuz%20Hakkında&body=Sayın%20${encodeURIComponent(k.name)},%0A%0AKVKK%20kapsamındaki%20talebinizle%20ilgili...`}
                      className="text-amber-400 hover:text-amber-300 text-xs underline underline-offset-2"
                    >
                      {k.email}
                    </a>
                    {k.trackingCode && (
                      <span className="text-zinc-500 text-xs font-mono">[{k.trackingCode}]</span>
                    )}
                    {k.status === 'in_progress' && (
                      <span className="text-amber-400 text-[10px] uppercase ml-auto">işlemde</span>
                    )}
                  </div>
                  {k.details && (
                    <p className="text-zinc-400 text-xs leading-snug whitespace-pre-wrap break-words">
                      {k.details}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-zinc-600 text-[10px]">
                      {new Date(k.createdAt).toLocaleString('tr-TR')}
                    </p>
                    <div className="flex gap-1">
                      {k.status !== 'in_progress' && (
                        <button
                          onClick={() => handleKvkkAction(k._id, 'in_progress')}
                          className="flex items-center gap-1 text-xs text-amber-400 hover:bg-amber-500/10 px-2 py-1 rounded-lg transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> İşleme Al
                        </button>
                      )}
                      <button
                        onClick={() => handleKvkkAction(k._id, 'resolved')}
                        className="flex items-center gap-1 text-xs text-emerald-400 hover:bg-emerald-500/10 px-2 py-1 rounded-lg transition"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Çözüldü
                      </button>
                    </div>
                  </div>
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
          <input ref={uploadInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
            onChange={e => {
              const newFiles = Array.from(e.target.files ?? []);
              if (!newFiles.length) return;
              setUploadFiles(prev => {
                const merged = [...prev, ...newFiles].slice(0, 3);
                setUploadPreviews(merged.map(f => URL.createObjectURL(f)));
                return merged;
              });
              e.target.value = '';
            }} />
          {!uploadPreviews.length ? (
            <button onClick={() => uploadInputRef.current?.click()}
              className="w-full border-2 border-dashed border-zinc-700 hover:border-amber-500/50 rounded-xl py-8 flex flex-col items-center gap-2 text-zinc-500 hover:text-zinc-300 transition">
              <ImagePlus className="w-8 h-8" />
              <span className="text-sm">Fotoğraf seç (maks 3)</span>
            </button>
          ) : (
            <div className="space-y-3">
              <div className={`grid gap-2 ${uploadPreviews.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
                {uploadPreviews.map((src, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden aspect-square bg-zinc-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    <button onClick={() => {
                      setUploadFiles(prev => { const n = prev.filter((_, j) => j !== i); setUploadPreviews(n.map(f => URL.createObjectURL(f))); return n; });
                    }} className="absolute top-1 right-1 bg-black/70 hover:bg-black rounded-full p-0.5">
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                    {i === 0 && uploadPreviews.length > 1 && (
                      <span className="absolute bottom-1 left-1 bg-amber-400 text-black text-xs px-1.5 py-0.5 rounded font-bold">Ana</span>
                    )}
                  </div>
                ))}
                {uploadPreviews.length < 3 && (
                  <button onClick={() => uploadInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-zinc-700 hover:border-amber-500/50 flex items-center justify-center text-zinc-600 hover:text-zinc-400 transition">
                    <ImagePlus className="w-6 h-6" />
                  </button>
                )}
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
                    {photo.isHidden && !photo.isArchived && (
                      <div className="absolute top-1.5 right-1.5 bg-red-500/80 text-white text-xs px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> Gizli
                      </div>
                    )}
                    {photo.moderationStatus === 'pending' && (
                      <div className="absolute bottom-1.5 left-1.5 bg-emerald-500/90 text-white text-xs px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Onay Bekliyor
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
                          style={{ pointerEvents: 'auto' }}
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
                      <div className="space-y-0.5">
                        {photo.comments.map(c => (
                          <div key={c._id} className="flex items-start gap-1">
                            <span className="text-zinc-400 text-xs flex-1 break-all leading-snug">{c.text}</span>
                            <button
                              onClick={() => deleteComment(photo._id, c._id)}
                              className="flex-shrink-0 text-red-500/40 hover:text-red-400 transition-colors">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-1">
                      <input
                        type="text"
                        maxLength={60}
                        placeholder="Yorum yaz..."
                        value={commentTexts[photo._id] ?? ''}
                        onChange={e => setCommentTexts(prev => ({ ...prev, [photo._id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && addComment(photo._id)}
                        className="flex-1 min-w-0 bg-zinc-800/60 border border-zinc-700/50 rounded px-2 py-0.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-amber-500/50"
                      />
                      <button
                        onClick={() => addComment(photo._id)}
                        disabled={commentingIds.has(photo._id) || !(commentTexts[photo._id] ?? '').trim()}
                        className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 rounded text-xs font-bold transition disabled:opacity-40 flex-shrink-0"
                      >
                        {commentingIds.has(photo._id) ? '…' : '+'}
                      </button>
                    </div>
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
                    {/* Yanlış gizlenmiş fotoğrafı geri aç */}
                    {photo.isHidden && photo.moderationStatus !== 'pending' && (
                      <button
                        onClick={() => forceUnhide(photo._id)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                      >
                        <Eye className="w-3 h-3" /> Geri Aç (gizlemeyi kaldır)
                      </button>
                    )}
                    {/* Admin'in kendi inisiyatifiyle gizle — sadece şu an görünür ve onay-beklemiyor olanlarda */}
                    {!photo.isHidden && photo.moderationStatus !== 'pending' && !photo.isArchived && (
                      <button
                        onClick={() => hidePhoto(photo._id)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
                      >
                        <EyeOff className="w-3 h-3" /> Gizle (yayından çek)
                      </button>
                    )}
                    {/* Doğrudan şampiyon ayarı — oy/tarih kısıtı bypass */}
                    <button
                      onClick={() => setChampionDirect(photo._id, photo.isChampion)}
                      className={`w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition ${
                        photo.isChampion
                          ? 'bg-amber-400 text-black hover:bg-amber-300'
                          : 'bg-amber-500/15 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      <Trophy className="w-3 h-3" />
                      {photo.isChampion ? 'Şampiyonluğu Kaldır' : 'Şampiyon Yap'}
                    </button>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => downloadPhoto(photo.url, photo.trackingCode)}
                        className="flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg py-1.5 px-2 text-zinc-300 text-xs transition"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setActionModal({ type: 'delete', photo, reason: 'Uygunsuz fotoğraf' })}
                        disabled={deletingIds.has(photo._id)}
                        className="flex-1 flex items-center justify-center gap-1 bg-red-950/50 hover:bg-red-900/60 border border-red-900/50 rounded-lg py-1.5 text-red-400 text-xs transition disabled:opacity-40"
                      >
                        <Trash2 className="w-3 h-3" /> Sil
                      </button>
                      <button
                        onClick={() => setActionModal({ type: 'ban', photo, reason: 'Uygunsuz fotoğraf' })}
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

      {/* Sebep seçici modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => !actionLoading && setActionModal(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 w-full max-w-xs space-y-4" onClick={e => e.stopPropagation()}>
            <p className="text-white font-semibold text-sm">
              {actionModal.type === 'delete' ? 'Fotoğrafı Sil' : 'IP Engelle'}
            </p>
            <p className="text-zinc-400 text-xs">Sebep seç:</p>
            <div className="flex flex-col gap-2">
              {REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setActionModal(m => m ? { ...m, reason: r } : m)}
                  className={`px-3 py-2 rounded-xl text-sm text-left transition border ${
                    actionModal.reason === r
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setActionModal(null)} disabled={actionLoading}
                className="flex-1 py-2 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:text-white transition disabled:opacity-40">
                İptal
              </button>
              <button onClick={confirmAction} disabled={actionLoading}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition disabled:opacity-40 ${
                  actionModal.type === 'delete'
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-orange-600 hover:bg-orange-500 text-white'
                }`}>
                {actionLoading ? '...' : actionModal.type === 'delete' ? 'Sil' : 'Engelle'}
              </button>
            </div>
          </div>
        </div>
      )}

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
