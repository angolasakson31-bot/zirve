const ipRequests = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(maxPerMinute: number) {
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
