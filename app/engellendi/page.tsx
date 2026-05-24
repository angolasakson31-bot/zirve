export default function EngellendPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 px-4">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
        <span className="text-3xl">🚫</span>
      </div>
      <h1 className="text-white font-bold text-2xl text-center">Erişiminiz Engellendi</h1>
      <p className="text-zinc-500 text-sm text-center max-w-xs">
        Bu cihazdan siteye erişim kısıtlanmıştır.
      </p>
    </div>
  );
}
