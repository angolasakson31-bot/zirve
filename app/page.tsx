import LeaderBoard from '@/components/LeaderBoard';
import RatingCard from '@/components/RatingCard';
import UploadForm from '@/components/UploadForm';
import TrackCode from '@/components/TrackCode';
import { Mountain, Zap } from 'lucide-react';
import ShareButton from '@/components/ShareButton';
import AddToHomeScreen from '@/components/AddToHomeScreen';
import HeaderFlash from '@/components/HeaderFlash';
import VisitorCount from '@/components/VisitorCount';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="relative border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur sticky top-0 z-50">
        <HeaderFlash />
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-1.5 bg-amber-400/10 rounded-lg">
            <Mountain className="w-5 h-5 text-amber-400" />
          </div>
          <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            ZİRVE X
          </span>
          <div className="hidden sm:flex items-center gap-1.5 bg-zinc-800/60 rounded-full px-3 py-1 ml-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-zinc-400 text-xs">Zirveye tırman, X ol</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <AddToHomeScreen />
            <div className="flex flex-col items-center gap-0.5">
              <ShareButton />
              <VisitorCount />
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-zinc-800/50 bg-gradient-to-b from-zinc-900 to-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
              En iyi kim{' '}
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                sen karar ver
              </span>
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              Fotoğrafını yükle, puanlan, zirveye çık. Kim olduğunu bilmeden
              fotoğrafları puanla, halk kimi seçer?
              Takip kodunu al, zirvede kal ve sana ulaşsınlar.
            </p>
          </div>
        </div>
      </div>

      {/* Slogan */}
      <div className="border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <p className="text-zinc-500 text-xs">
            Zirveye tırman, X ol — fotoğrafını yükle, puanlansın, size ulaşsınlar —{' '}
            <span className="text-amber-400">kimi zirveye çıkarmak istiyorsan yükle ve insanlara sun...</span>
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <LeaderBoard />
        <RatingCard />
        <TrackCode />
        <div id="upload-form"><UploadForm /></div>

        {/* Telegram notu */}
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 px-4 py-3.5 flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-sky-400" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sky-300 font-bold text-sm leading-snug mb-0.5">
              Grubuna ekle veya kanal kur
            </p>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Kendi Telegram grubuna veya kanalına eklemek, iş birliği ya da özel kurulum için{' '}
              <span className="text-sky-400 font-bold">@ZIRVENAMUS</span> yazın.
            </p>
          </div>
        </div>

        {/* Yasal bilgiler — kompakt */}
        <div className="border-t border-zinc-800 pt-5 space-y-1.5 text-zinc-600 text-xs leading-relaxed">
          <p>
            <strong className="text-zinc-500">18+ platformdur.</strong>{' '}
            Siteyi kullanarak tüm yasal koşulları okuduğunuzu ve kabul ettiğinizi beyan etmiş olursunuz.
            İçerik yükleyerek fotoğraftaki kişilerin açık rızasını aldığınızı taahhüt etmiş olursunuz.
            Rıza dışı içerik, küçüklere ait materyal ve hakaret içeren yorumlar kesinlikle yasaktır;
            sorumluluk kullanıcıya aittir. Yüklenen fotoğraflar Cloudinary (ABD) altyapısında saklanır.
          </p>
          <p>
            İçerik kaldırma ve KVKK başvuruları:{' '}
            <a
              href="mailto:angolasakson34@gmail.com"
              className="text-amber-500 hover:text-amber-400 underline underline-offset-2"
            >
              angolasakson34@gmail.com
            </a>
            {' '}· Telegram: <strong className="text-zinc-500">@ZIRVENAMUS</strong>
            {' '}·{' '}
            <Link
              href="/yasal"
              className="text-amber-500 hover:text-amber-400 underline underline-offset-2"
            >
              Yasal Koşulların Tamamı →
            </Link>
          </p>
          <p className="text-zinc-700">
            © {new Date().getFullYear()} ZİRVE X — Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </main>
  );
}
