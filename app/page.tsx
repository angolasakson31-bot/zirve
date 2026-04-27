export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 px-4">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl">
        🔒
      </div>
      <h1 className="text-white font-bold text-2xl text-center">Site Şu An Kapalı</h1>
      <p className="text-zinc-500 text-sm text-center max-w-xs">
        Yakında geri döneceğiz. Takipte kal.
      </p>
    </main>
  );
}
