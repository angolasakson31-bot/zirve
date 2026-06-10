import { NextRequest, NextResponse } from 'next/server';

// Güvenlik header'larının tek kaynağı next.config.ts'tir.
// Middleware sadece (a) layout'un kullanabileceği x-pathname'i ekler
// ve (b) API yanıtlarının cache'lenmesini engeller.
export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  res.headers.set('x-pathname', req.nextUrl.pathname);

  if (req.nextUrl.pathname.startsWith('/api/')) {
    res.headers.set('Cache-Control', 'no-store, max-age=0');
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
