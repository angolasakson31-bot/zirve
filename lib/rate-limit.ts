export function rateLimit(maxPerMinute: number) {
  const ipRequests = new Map<string, { count: number; resetAt: number }>();

  // Her 10 dakikada süresi dolmuş kayıtları temizle
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of ipRequests) {
      if (entry.resetAt < now) ipRequests.delete(key);
    }
  }, 10 * 60 * 1000);

  return (ip: string): boolean => {
    const now = Date.now();
    const entry = ipRequests.get(ip);
    if (!entry || entry.resetAt < now) {
      ipRequests.set(ip, { count: 1, resetAt: now + 60_000 });
      return true;
    }
    if (entry.count >= maxPerMinute) return false;
    entry.count++;
    return true;
  };
}
