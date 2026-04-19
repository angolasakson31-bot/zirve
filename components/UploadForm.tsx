'use client';
import { useState, useRef } from 'react';
import { Upload, ImagePlus, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

export default function UploadForm() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setStatus('idle');
    setMessage('');
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const submit = async () => {
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/photos/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) { setStatus('error'); setMessage(data.error || 'Hata oluştu.'); }
      else { setStatus('success'); setMessage('Fotoğrafın yüklendi! Puanlamaya açık.'); setPreview(null); setFile(null); }
    } catch {
      setStatus('error'); setMessage('Bağlantı hatası.');
    }
    setUploading(false);
  };

  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-800">
        <Upload className="w-4 h-4 text-zinc-400" />
        <span className="text-zinc-400 text-sm font-medium">Fotoğraf Yükle</span>
      </div>
      <div className="p-5 space-y-4">
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-zinc-500 transition overflow-hidden"
        >
          {preview ? (
            <div className="relative aspect-square w-full">
              <Image src={preview} alt="Önizleme" fill className="object-cover" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-zinc-500">
              <ImagePlus className="w-10 h-10" />
              <p className="text-sm">Sürükle bırak veya tıkla</p>
              <p className="text-xs text-zinc-600">JPEG, PNG, WebP · Maks 10MB</p>
            </div>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ''; }} />

        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-400 text-sm bg-green-950/40 rounded-lg px-3 py-2">
            <CheckCircle className="w-4 h-4 shrink-0" /> {message}
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/40 rounded-lg px-3 py-2">
            <XCircle className="w-4 h-4 shrink-0" /> {message}
          </div>
        )}

        <button
          onClick={submit}
          disabled={!file || uploading}
          className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-100 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <><span className="animate-spin inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full" /> Yükleniyor...</>
          ) : (
            <><Upload className="w-4 h-4" /> Yükle</>
          )}
        </button>
      </div>
    </div>
  );
}
