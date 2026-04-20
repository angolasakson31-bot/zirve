import LeaderBoard from '@/components/LeaderBoard';
import RatingCard from '@/components/RatingCard';
import UploadForm from '@/components/UploadForm';
import TrackCode from '@/components/TrackCode';
import { Mountain, Zap } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-1.5 bg-amber-400/10 rounded-lg">
            <Mountain className="w-5 h-5 text-amber-400" />
          </div>
          <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            ZİRVE
          </span>
          <div className="hidden sm:flex items-center gap-1.5 bg-zinc-800/60 rounded-full px-3 py-1 ml-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-zinc-400 text-xs">Körlemesine puan ver, zirveyi belirle</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-zinc-800/50 bg-gradient-to-b from-zinc-900 to-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
              En iyi fotoğraf{' '}
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                sen karar ver
              </span>
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              Kim olduğunu bilmeden fotoğrafları puanla. Halk kimi seçer, kim zirveye çıkar?
              Fotoğrafını yükle, takip kodunu al ve kaç kişinin beğendiğini gör.
            </p>
          </div>
        </div>
      </div>

      {/* Nasıl Çalışır */}
      <div className="border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap gap-x-6 gap-y-1">
          {[
            'Fotoğrafını yükle → takip kodunu al',
            'Rastgele fotolara puan ver',
            'En yüksek skor günün lideri',
            'Kodunla kendi puanını gör',
          ].map((text, i) => (
            <span key={i} className="text-zinc-500 text-xs">
              <span className="text-amber-400 font-bold mr-1">{i + 1}.</span>{text}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-5">
          <LeaderBoard />
          <UploadForm />
          <TrackCode />
        </div>
        <div className="lg:col-span-2">
          <RatingCard />
        </div>
      </div>
    </main>
  );
}
