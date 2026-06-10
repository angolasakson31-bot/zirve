'use client';
import { useState } from 'react';
import { Flag, X, CheckCircle } from 'lucide-react';
import { getDeviceToken } from '@/hooks/useUploadGate';

type Reason = 'ncii' | 'minor' | 'insult' | 'copyright' | 'personal_data' | 'other';

const REASONS: { value: Reason; label: string }[] = [
  { value: 'ncii',          label: 'Rıza dışı mahrem içerik' },
  { value: 'minor',          label: '18 yaşından küçük bir kişi' },
  { value: 'insult',         label: 'Hakaret / iftira' },
  { value: 'copyright',      label: 'Telif hakkı ihlali' },
  { value: 'personal_data',  label: 'Kişisel veri ifşası' },
  { value: 'other',          label: 'Diğer' },
];

export default function ReportButton({ photoId, compact = false }: { photoId: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason | ''>('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!reason) {
      setError('Lütfen bir sebep seçin.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/photos/${photoId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, details: details.trim().slice(0, 500), dt: getDeviceToken() }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
      } else {
        setError(data.error ?? 'Şikâyet gönderilemedi.');
      }
    } catch {
      setError('Bağlantı hatası.');
    }
    setSubmitting(false);
  };

  const close = () => {
    setOpen(false);
    setReason('');
    setDetails('');
    setDone(false);
    setError('');
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          compact
            ? 'text-zinc-500 hover:text-red-400 text-xs flex items-center gap-1 transition-colors'
            : 'text-zinc-500 hover:text-red-400 text-xs flex items-center gap-1.5 px-2 py-1 rounded-md border border-zinc-800 hover:border-red-500/30 transition-colors'
        }
        aria-label="Şikâyet et"
        type="button"
      >
        <Flag className="w-3.5 h-3.5" />
        <span>Şikâyet</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4" onClick={close}>
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
              <span className="font-bold text-zinc-200 text-sm flex items-center gap-2">
                <Flag className="w-4 h-4 text-red-400" /> İçeriği Şikâyet Et
              </span>
              <button onClick={close} className="text-zinc-500 hover:text-white" aria-label="Kapat">
                <X className="w-4 h-4" />
              </button>
            </div>

            {done ? (
              <div className="p-6 flex flex-col items-center gap-3 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
                <p className="text-zinc-200 font-semibold text-sm">Şikâyetiniz alındı.</p>
                <p className="text-zinc-500 text-xs leading-relaxed">
                  En geç 48 saat içinde incelenecektir. Yasal koşullara aykırı bulunursa içerik kaldırılır.
                </p>
                <button onClick={close} className="mt-2 px-4 py-2 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm">
                  Kapat
                </button>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 text-xs font-medium">Şikâyet sebebi</label>
                  <div className="space-y-1">
                    {REASONS.map(r => (
                      <label key={r.value} className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                        <input
                          type="radio"
                          name="reason"
                          value={r.value}
                          checked={reason === r.value}
                          onChange={() => setReason(r.value)}
                          className="accent-red-400"
                        />
                        {r.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 text-xs font-medium">Detay (isteğe bağlı, maks 500 karakter)</label>
                  <textarea
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Açıklama ekleyebilirsiniz..."
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-red-500/60 outline-none rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 resize-none"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-xs">{error}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={close}
                    className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium"
                    type="button"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={submit}
                    disabled={submitting || !reason}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                  >
                    {submitting ? 'Gönderiliyor...' : 'Şikâyet Et'}
                  </button>
                </div>

                <p className="text-zinc-600 text-[10px] leading-relaxed">
                  Asılsız şikâyetler dikkate alınmaz. 3 farklı şikâyet alan içerik admin incelemesine kadar
                  otomatik olarak gizlenir.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
