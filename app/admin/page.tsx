'use client';
import { useState, useEffect, useCallback } from 'react';
import { Trash2, Ban, Eye, Lock, RefreshCw, CheckCircle } from 'lucide-react';
import Image from 'next/image';

interface AdminPhoto {
  _id: string;
  url: string;
  uploaderIp: string;
  average: number;
  voteCount: number;
  isChampion: boolean;
  createdAt: string;
  trackingCode: string;
}

const SESSION_KEY = 'zirve_admin_pw';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [banningIps, setBanningIps] = useState<Set<string>>(new Set());

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
          <button onClick={() => fetchPhotos(password)} disabled={loading}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition disabled:opacity-40">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Yenile
          </button>
        </div>

        {loading && photos.length === 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-zinc-800 rounded-xl aspect-square" />
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map(photo => (
            <div key={photo._id} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              <div className="relative aspect-square bg-zinc-800">
                <Image src={photo.url} alt={photo.trackingCode} fill className="object-cover" unoptimized />
                {photo.isChampion && (
                  <div className="absolute top-1.5 left-1.5 bg-amber-400 text-black text-xs font-bold px-2 py-0.5 rounded-lg">
                    Şampiyon
                  </div>
                )}
              </div>
              <div className="p-3 space-y-2">
                <div className="text-xs text-zinc-500 font-mono">{photo.trackingCode}</div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>⭐ {photo.average.toFixed(1)}</span>
                  <span>{photo.voteCount} oy</span>
                </div>
                <div className="text-xs text-zinc-600 font-mono truncate">{photo.uploaderIp}</div>
                <div className="text-xs text-zinc-700">{new Date(photo.createdAt).toLocaleDateString('tr-TR')}</div>
                <div className="flex gap-1.5 pt-1">
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
          ))}
        </div>

        {!loading && photos.length === 0 && (
          <p className="text-center text-zinc-600 py-20">Henüz fotoğraf yok.</p>
        )}
      </div>
    </div>
  );
}
