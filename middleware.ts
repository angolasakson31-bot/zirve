import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // Site aktif
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
