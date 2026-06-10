import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-ip';

export const runtime = 'nodejs';

const checkLimit = rateLimit(60);

export async function GET(req: NextRequest) {
  const rawIp = getClientIp(req);
  if (!checkLimit(rawIp))
    return NextResponse.json({ ok: false }, { status: 429 });
  return NextResponse.json({ ok: true, ts: Date.now() });
}
