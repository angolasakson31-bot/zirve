import { NextRequest, NextResponse } from 'next/server';
import { verifyAgeToken, AGE_COOKIE_NAME } from '@/lib/age-token';

// Yaş onayı gereken public içerik API'leri.
// Sayfaları (örn. /) etkilemeyiz — sayfa zaten AgeGate modalı gösterir.
// API'leri koruyarak frontend bypass'ını da kapatıyoruz.
const AGE_GATED_API_PREFIXES = [
  '/api/photos/random',
  '/api/photos/has-new',
  '/api/photos/contact',
  '/api/leader',
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  res.headers.set('x-pathname', pathname);

  if (pathname.startsWith('/api/')) {
    res.headers.set('Cache-Control', 'no-store, max-age=0');
  }

  // Yaş onayı zorla — sadece belirli public içerik API'leri için
  if (AGE_GATED_API_PREFIXES.some(p => pathname.startsWith(p))) {
    const token = req.cookies.get(AGE_COOKIE_NAME)?.value;
    const valid = await verifyAgeToken(token);
    if (!valid) {
      return NextResponse.json(
        { error: 'Yaş onayı gerekli.' },
        { status: 403, headers: { 'Cache-Control': 'no-store' } },
      );
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
