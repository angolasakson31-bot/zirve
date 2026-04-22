'use client';
import { useState, useRef } from 'react';
import { Upload, ImagePlus, Copy, Check, AlertCircle, Sparkles, Share2, X, Images } from 'lucide-react';
import { markUploaded } from '@/hooks/useUploadGate';

const MAX_FILES = 3;

export default function UploadForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [contactPlatform, setContactPlatform] = useState('Telegram');
  const [contactValue, setContactValue] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const checkImageVariance = (dataUrl: string): Promise<boolean> =>
    new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 64;
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(true);
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let sum = 0, sumSq = 0, n = 0;
        for (let i = 0; i < data.length; i += 4) {
          const v = (data[i] + data[i + 1] + data[i + 2]) / 3;
          sum += v; sumSq += v * v; n++;
        }
        const mean = sum / n;
        resolve(sumSq / n - mean * mean > 80);
      };
      img.onerror = () => resolve(true);
      img.src = dataUrl;
    });

  const addFiles = (newFiles: File[]) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const valid = newFiles.filter(f => allowed.includes(f.type) && f.size <= 10 * 1024 * 1024);
    setFiles(prev => {
      const merged = [...prev, ...valid].slice(0, MAX_FILES);
      // generate previews for new ones
      merged.slice(prev.length).forEach((f, i) => {
        const reader = new FileReader();
        reader.onload = e => {
          setPreviews(p => {
            const next = [...p];
            next[prev.length + i] = e.target?.result as string;
            return next;
          });
        };
        reader.readAsDataURL(f);
      });
      return merged;
    });
    setError('');
    setTrackingCode('');
  };

  const removeFile = (idx: number) => {
    setFiles(f => f.filter((_, i) => i !== idx));
    setPreviews(p => p.filter((_, i) => i !== idx));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addFiles(Array.from(e.dataTransfer.files));
  };

  const copy = async () => {
    await navigator.clipboard.writeText(trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setFiles([]); setPreviews([]);
    setContactPlatform('Telegram'); setContactValue('');
    setTrackingCode(''); setError('');
  };

  const submit = async () => {
    if (!files.length) return;
    setUploading(true); setError('');

    for (const preview of previews) {
      if (preview) {
        const valid = await checkImageVariance(preview);
        if (!valid) {
          setError('Boş veya tek renkli fotoğraf yüklenemez.');
          setUploading(false); return;
        }
      }
    }
    if (!contactValue.trim()) {
      setError('İletişim bilgisi zorunludur.');
      setUploading(false); return;
    }

    const form = new FormData();
    files.forEach(f => form.append('files', f));
    form.append('contactInfo', `${contactPlatform}: ${contactValue.trim()}`);

    try {
      const res = await fetch('/api/photos/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Hata oluştu.'); }
      else {
        markUploaded();
        window.dispatchEvent(new CustomEvent('zirve:photoUploaded'));
        setTrackingCode(data.trackingCode);
        setFiles([]); setPreviews([]);
      }
    } catch {
      setError('Bağlantı hatası.');
    }
    setUploading(false);
  };

  if (trackingCode) {
    return (
      <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-950/30 to-zinc-900 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-amber-500/20 bg-amber-500/10">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 text-sm font-semibold">Fotoğrafın yüklendi!</span>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-zinc-400 text-sm">Takip kodun — bunu kaydet, fotoğrafının istatistiklerini görmek için kullanacaksın:</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-zinc-800 border border-zinc-600 rounded-xl px-4 py-3 font-mono text-xl font-bold text-white tracking-widest text-center">
              {trackingCode}
            </div>
            <button onClick={copy} className="shrink-0 p-3 bg-zinc-700 hover:bg-zinc-600 rounded-xl transition">
              {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-zinc-300" />}
            </button>
          </div>
          <button
            onClick={async () => {
              const url = window.location.origin;
              if (navigator.share) {
                try { await navigator.share({ title: 'ZİRVE NAMUS', text: 'Namusumu zirveye taşı! Fotoğrafıma oy ver, size ulaşayım.', url }); return; } catch {}
              }
              await navigator.clipboard.writeText(url);
            }}
            className="w-full py-2.5 rounded-xl bg-amber-400/10 border border-amber-500/40 text-amber-400 hover:bg-amber-400/20 text-sm font-medium transition flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" /> Arkadaşlarına paylaş, daha fazla oy al!
          </button>
          <button onClick={reset} className="w-full py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-sm transition">
            Başka fotoğraf yükle
          </button>
        </div>
      </div>
    );
  }

  const isAlbum = files.length > 1;

  return (
    <div className="rounded-2xl border border-zinc-700/80 bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-800">
        <Upload className="w-4 h-4 text-zinc-400" />
        <span className="text-zinc-400 text-sm font-medium">Fotoğraf Yükle</span>
        <span className="ml-auto text-zinc-600 text-xs">Maks {MAX_FILES} foto</span>
      </div>
      <div className="p-5 space-y-3">

        {/* Önizleme grid veya boş alan */}
        {files.length === 0 ? (
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-amber-500/50 transition-colors"
          >
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-zinc-500">
              <ImagePlus className="w-9 h-9" />
              <p className="text-sm">Sürükle bırak veya tıkla</p>
              <p className="text-xs text-zinc-600">JPEG, PNG, WebP · Maks 10MB · Tek veya albüm (2–3 foto)</p>
            </div>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            className="space-y-2"
          >
            {isAlbum && (
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
                <Images className="w-3.5 h-3.5" />
                Albüm olarak yüklenecek ({files.length} fotoğraf)
              </div>
            )}
            <div className={`grid gap-2 ${files.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
              {previews.map((src, i) => src && (
                <div key={i} className="relative rounded-xl overflow-hidden bg-zinc-800 aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 bg-black/70 hover:bg-black rounded-full p-0.5"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                  {i === 0 && isAlbum && (
                    <span className="absolute bottom-1 left-1 bg-amber-400 text-black text-xs px-1.5 py-0.5 rounded font-bold">Ana</span>
                  )}
                </div>
              ))}
              {files.length < MAX_FILES && (
                <button
                  onClick={() => inputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-zinc-700 hover:border-amber-500/50 flex items-center justify-center text-zinc-600 hover:text-zinc-400 transition"
                >
                  <ImagePlus className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={e => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value = ''; }}
        />

        {/* İletişim */}
        <div className="space-y-2">
          <label className="text-zinc-400 text-xs font-medium flex items-center gap-1">
            İletişim Bilgisi <span className="text-red-400">*</span>
          </label>
          <p className="text-zinc-600 text-xs">Namusunuzu zirveye taşıtın — size ulaşsınlar</p>
          <div className="flex gap-1.5 flex-wrap">
            {(['Telegram', 'Instagram', 'Telefon', 'E-posta'] as const).map(p => (
              <button key={p} type="button"
                onClick={() => { setContactPlatform(p); setContactValue(''); }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${contactPlatform === p ? 'bg-amber-400 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                {p}
              </button>
            ))}
          </div>
          <input
            type={contactPlatform === 'Telefon' ? 'tel' : contactPlatform === 'E-posta' ? 'email' : 'text'}
            value={contactValue}
            onChange={e => setContactValue(e.target.value)}
            maxLength={150}
            placeholder={
              contactPlatform === 'Telegram' ? '@kullanıcıadı' :
              contactPlatform === 'Instagram' ? '@profil' :
              contactPlatform === 'Telefon' ? '0555 123 45 67' : 'ornek@mail.com'
            }
            className="w-full bg-zinc-800 border border-zinc-700 focus:border-amber-500/70 outline-none rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 transition"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/40 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <button onClick={submit} disabled={!files.length || !contactValue.trim() || uploading}
          className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold py-3 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
          {uploading
            ? <><span className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full inline-block" /> Yükleniyor...</>
            : isAlbum
              ? <><Images className="w-4 h-4" /> Albümü Yükle ({files.length} foto)</>
              : <><Upload className="w-4 h-4" /> Yükle ve Kod Al</>
          }
        </button>
      </div>
    </div>
  );
}
