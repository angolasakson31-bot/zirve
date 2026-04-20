import LeaderBoard from '@/components/LeaderBoard';
import RatingCard from '@/components/RatingCard';
import UploadForm from '@/components/UploadForm';
import TrackCode from '@/components/TrackCode';
import { Mountain, Zap, Upload, Star, Trophy, Search } from 'lucide-react';

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
      <div className="border-b border-zinc-800/50 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Upload, step: '1', text: 'Fotoğrafını yükle, takip kodunu al' },
              { icon: Star,   step: '2', text: 'Rastgele gelen fotoğraflara puan ver' },
              { icon: Trophy, step: '3', text: 'En yüksek skorlu fotoğraf günün lideri olur' },
              { icon: Search, step: '4', text: 'Takip kodunla kendi puanını gör' },
            ].map(({ icon: Icon, step, text }) => (
              <div key={step} className="flex items-start gap-3 bg-zinc-900/60 rounded-xl p-3">
                <div className="shrink-0 w-7 h-7 rounded-lg bg-amber-400/10 flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div>
                  <span className="text-zinc-600 text-xs">Adım {step}</span>
                  <p className="text-zinc-300 text-xs mt-0.5 leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
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
