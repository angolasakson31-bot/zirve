import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

  if (req.nextUrl.pathname.startsWith('/api/')) {
    res.headers.set('Cache-Control', 'no-store, max-age=0');
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
