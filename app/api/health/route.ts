import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const checkLimit = rateLimit(60);

export async function GET(req: NextRequest) {
  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '0.0.0.0';
  if (!checkLimit(rawIp))
    return NextResponse.json({ ok: false }, { status: 429 });
  return NextResponse.json({ ok: true, ts: Date.now() });
}
