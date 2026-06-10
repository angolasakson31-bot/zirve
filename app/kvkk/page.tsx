'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Mountain, ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react';

type RequestType = 'access' | 'delete' | 'correct' | 'object' | 'other';

const TYPES: { value: RequestType; label: string; desc: string }[] = [
  { value: 'access',  label: 'Bilgi talebi',        desc: 'Hakkımda işlenen kişisel verileri öğrenmek istiyorum.' },
  { value: 'delete',  label: 'Silme talebi',        desc: 'Verilerimin silinmesini talep ediyorum.' },
  { value: 'correct', label: 'Düzeltme talebi',     desc: 'Yanlış veya eksik verilerin düzeltilmesini istiyorum.' },
  { value: 'object',  label: 'İşlemeye itiraz',     desc: 'Verilerimin işlenmesine itiraz ediyorum.' },
  { value: 'other',   label: 'Diğer',               desc: 'Diğer KVKK kapsamındaki taleplerim.' },
];

export default function KvkkPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [requestType, setRequestType] = useState<RequestType>('access');
  const [details, setDetails] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ requestId: string; message: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/kvkk/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, requestType, details, trackingCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone({ requestId: data.requestId, message: data.message });
      } else {
        setError(data.error ?? 'Talep gönderilemedi.');
      }
    } catch {
      setError('Bağlantı hatası.');
    }
    setSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="p-1.5 bg-amber-400/10 rounded-lg">
              <Mountain className="w-4 h-4 text-amber-400" />
            </div>
            <span className="font-black text-base tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              ZİRVE X
            </span>
          </Link>
          <span className="text-zinc-600 text-xs ml-1">/ KVKK Başvuru</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-black text-white mb-1 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" /> KVKK Başvuru Formu
          </h1>
          <p className="text-zinc-500 text-xs leading-relaxed">
            6698 Sayılı Kişisel Verilerin Korunması Kanunu kapsamındaki haklarınızı kullanmak için
            bu formu doldurabilirsiniz. Talepler en geç <strong className="text-zinc-400">30 gün</strong>{' '}
            içinde değerlendirilir.
          </p>
        </div>

        {done ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center space-y-3">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-zinc-200 font-bold">Talebiniz alındı</p>
            <p className="text-zinc-400 text-sm">{done.message}</p>
            <p className="text-zinc-600 text-xs">
              Talep numaranız: <span className="font-mono text-zinc-400">{done.requestId}</span>
            </p>
            <Link href="/" className="inline-block mt-2 text-amber-500 hover:text-amber-400 text-sm underline underline-offset-2">
              Ana sayfaya dön
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="space-y-1.5">
              <label className="text-zinc-300 text-xs font-medium">Ad-soyad <span className="text-red-400">*</span></label>
              <input
                type="text" required maxLength={100} value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 focus:border-amber-500/60 outline-none rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-300 text-xs font-medium">E-posta <span className="text-red-400">*</span></label>
              <input
                type="email" required maxLength={200} value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 focus:border-amber-500/60 outline-none rounded-xl px-3 py-2 text-sm text-white"
              />
              <p className="text-zinc-600 text-[10px]">Cevap bu adrese gönderilecektir.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-300 text-xs font-medium">Talep türü <span className="text-red-400">*</span></label>
              <div className="space-y-1.5">
                {TYPES.map(t => (
                  <label key={t.value} className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-zinc-800/60 transition-colors">
                    <input
                      type="radio" name="requestType" value={t.value}
                      checked={requestType === t.value}
                      onChange={() => setRequestType(t.value)}
                      className="mt-0.5 accent-amber-400"
                    />
                    <div className="min-w-0">
                      <p className="text-zinc-200 text-sm font-medium">{t.label}</p>
                      <p className="text-zinc-500 text-xs">{t.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-300 text-xs font-medium">Takip kodu (varsa)</label>
              <input
                type="text" maxLength={20} value={trackingCode} onChange={e => setTrackingCode(e.target.value)}
                placeholder="Örn: ZRV-AB23X"
                className="w-full bg-zinc-800 border border-zinc-700 focus:border-amber-500/60 outline-none rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600"
              />
              <p className="text-zinc-600 text-[10px]">Yüklediğiniz fotoğrafa ait takip kodunu girerseniz işlem hızlanır.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-300 text-xs font-medium">Detay</label>
              <textarea
                rows={5} maxLength={2000} value={details} onChange={e => setDetails(e.target.value)}
                placeholder="Talebinizi mümkün olduğunca detaylı açıklayın..."
                className="w-full bg-zinc-800 border border-zinc-700 focus:border-amber-500/60 outline-none rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 resize-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-950/40 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <button
              type="submit" disabled={submitting}
              className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {submitting ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
            </button>

            <p className="text-zinc-600 text-[10px] leading-relaxed text-center">
              Başvurunuzun değerlendirilebilmesi için kimliğinizi doğrulamamız gerekebilir.
              Cevap e-posta adresinize gönderilir.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
