import { NextRequest, NextResponse } from 'next/server';

let _mCache = { on: false, t: 0 };

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPage = !pathname.startsWith('/api/') &&
                 !pathname.startsWith('/kapali') &&
                 !pathname.startsWith('/admin') &&
                 !pathname.startsWith('/_next') &&
                 !pathname.startsWith('/favicon');

  if (isPage) {
    const now = Date.now();
    if (now - _mCache.t > 15_000) {
      try {
        const url = new URL('/api/maintenance-status', req.url);
        const r = await fetch(url, { cache: 'no-store' });
        const d = await r.json();
        _mCache = { on: d.maintenance === true, t: now };
      } catch {
        // hata olursa bakım modunu açma
      }
    }
    if (_mCache.on) {
      return NextResponse.redirect(new URL('/kapali', req.url));
    }
  }

  const res = NextResponse.next();

  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

  if (pathname.startsWith('/api/')) {
    res.headers.set('Cache-Control', 'no-store, max-age=0');
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
