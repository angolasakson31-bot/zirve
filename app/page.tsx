import LeaderBoard from '@/components/LeaderBoard';
import RatingCard from '@/components/RatingCard';
import UploadForm from '@/components/UploadForm';
import { Mountain } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <Mountain className="w-6 h-6 text-amber-400" />
          <span className="font-black text-xl tracking-tight">ZİRVE</span>
          <span className="text-zinc-500 text-sm hidden sm:block">· Körlemesine puan ver, zirveyi belirle</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <LeaderBoard />
          <UploadForm />
        </div>
        <div className="lg:col-span-2">
          <RatingCard />
        </div>
      </div>
    </main>
  );
}
