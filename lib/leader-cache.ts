// Liderlik tablosu için paylaşılan cache.
// /api/leader 15 saniyelik snapshot serve eder; vote/admin gibi şampiyonu
// değiştirebilecek endpoint'ler invalidateLeaderCache() çağırır.

type CacheEntry = { data: unknown; at: number };

declare global {
  // eslint-disable-next-line no-var
  var __leaderCache: CacheEntry | null | undefined;
}

const CACHE_TTL_MS = 15_000;

export function readLeaderCache(): unknown | null {
  const c = global.__leaderCache;
  if (!c) return null;
  if (Date.now() - c.at >= CACHE_TTL_MS) return null;
  return c.data;
}

export function writeLeaderCache(data: unknown): void {
  global.__leaderCache = { data, at: Date.now() };
}

export function invalidateLeaderCache(): void {
  global.__leaderCache = null;
}

export { CACHE_TTL_MS };
