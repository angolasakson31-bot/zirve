import type { NextRequest } from 'next/server';

const FALLBACK = '0.0.0.0';

type HeaderLike = { get(name: string): string | null };
type ReqLike = { headers: HeaderLike };

export function getClientIp(req: NextRequest | Request | ReqLike): string {
  return getClientIpFromHeaders(req.headers);
}

export function getClientIpFromHeaders(h: HeaderLike): string {
  // Render LB her zaman x-forwarded-for'a istemci IP'sini ekler. Son entry
  // güvenilir kabul edilir. x-real-ip fallback'i istemci tarafından
  // spoof'lanabildiği için kullanılmıyor — Render bunu zaten set'liyor olur.
  const xff = h.get('x-forwarded-for');
  if (xff) {
    const parts = xff.split(',').map(s => s.trim()).filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last;
  }
  return FALLBACK;
}
