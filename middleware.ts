import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  if (process.env.SITE_ENABLED === 'false') {
    const url = req.nextUrl.clone();
    if (url.pathname !== '/kapali') {
      url.pathname = '/kapali';
      return NextResponse.rewrite(url);
    }
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
