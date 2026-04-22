import LeaderBoard from '@/components/LeaderBoard';
import RatingCard from '@/components/RatingCard';
import UploadForm from '@/components/UploadForm';
import TrackCode from '@/components/TrackCode';
import { Mountain, Zap } from 'lucide-react';
import ShareButton from '@/components/ShareButton';
import AddToHomeScreen from '@/components/AddToHomeScreen';
import HeaderFlash from '@/components/HeaderFlash';

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
            ZİRVE NAMUS
          </span>
          <div className="hidden sm:flex items-center gap-1.5 bg-zinc-800/60 rounded-full px-3 py-1 ml-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-zinc-400 text-xs">Namusunuzu zirveye taşıyın</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <AddToHomeScreen />
            <ShareButton />
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
              Namusunuzu zirveye taşıtın. Kim olduğunu bilmeden fotoğrafları puanla, halk kimi seçer?
              Fotoğrafını yükle, takip kodunu al, zirvede kal ve sana ulaşsınlar.
            </p>
          </div>
        </div>
      </div>

      {/* Slogan */}
      <div className="border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <p className="text-zinc-500 text-xs">
            Namusunuzu zirveye taşıtın — fotoğrafını yükle, puanlansın, size ulaşsınlar —{' '}
            <span className="text-amber-400">kimi zirveye çıkarmak istiyorsan yükle ve insanlara sun...</span>
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <LeaderBoard />
        <RatingCard />
        <TrackCode />
        <UploadForm />

        {/* Yasal bilgiler */}
        <div className="border-t border-zinc-800 pt-6 space-y-2 text-zinc-600 text-xs leading-relaxed">
          <p className="font-semibold text-zinc-500">Yasal Uyarı</p>
          <p>
            Bu platform yalnızca <strong className="text-zinc-400">18 yaş ve üzeri</strong> kullanıcılara yöneliktir.
            Siteye erişim sağlayarak yasal yaşı doldurduğunuzu kabul etmiş olursunuz.
          </p>
          <p>
            Platformda yayınlanan tüm içerikler kullanıcılar tarafından gönüllü olarak yüklenmiştir.
            Site yönetimi içeriklerin doğruluğundan veya üçüncü taraflara etkisinden sorumlu tutulamaz.
            İzniniz olmadan yüklenen bir içeriğin kaldırılmasını talep etmek için Telegram üzerinden{' '}
            <strong className="text-zinc-400">@KasapTRTR</strong> hesabına ulaşabilirsiniz.
          </p>
          <p>
            Kişisel verileriniz 6698 sayılı <strong className="text-zinc-400">KVKK</strong> kapsamında korunmaktadır.
            Yüklenen fotoğraflar yalnızca platform içi puanlama amacıyla kullanılır; üçüncü taraflarla paylaşılmaz.
          </p>
          <p className="pt-1 text-zinc-700">
            © {new Date().getFullYear()} ZİRVE NAMUS — Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </main>
  );
}
