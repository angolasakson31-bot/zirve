'use client';
import { useState, useRef } from 'react';
import { Upload, ImagePlus, Copy, Check, AlertCircle, Sparkles } from 'lucide-react';

export default function UploadForm() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setError('');
    setTrackingCode('');
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setPreview(null);
    setFile(null);
    setTrackingCode('');
    setError('');
  };

  const submit = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/photos/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Hata oluştu.');
      else {
        setTrackingCode(data.trackingCode);
        setPreview(null);
        setFile(null);
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
            <button
              onClick={copy}
              className="shrink-0 p-3 bg-zinc-700 hover:bg-zinc-600 rounded-xl transition"
            >
              {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-zinc-300" />}
            </button>
          </div>
          <button onClick={reset} className="w-full py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-sm transition">
            Başka fotoğraf yükle
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-700/80 bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-800">
        <Upload className="w-4 h-4 text-zinc-400" />
        <span className="text-zinc-400 text-sm font-medium">Fotoğraf Yükle</span>
      </div>
      <div className="p-5 space-y-3">
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-amber-500/50 transition-colors overflow-hidden"
        >
          {preview ? (
            <div className="flex items-center justify-center bg-zinc-900 max-h-80 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Önizleme" className="max-w-full max-h-80 object-contain" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-zinc-500">
              <ImagePlus className="w-9 h-9" />
              <p className="text-sm">Sürükle bırak veya tıkla</p>
              <p className="text-xs text-zinc-600">JPEG, PNG, WebP · Maks 10MB</p>
            </div>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ''; }} />

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/40 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <button onClick={submit} disabled={!file || uploading}
          className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold py-3 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
          {uploading
            ? <><span className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full inline-block" /> Yükleniyor...</>
            : <><Upload className="w-4 h-4" /> Yükle ve Kod Al</>}
        </button>
      </div>
    </div>
  );
}
