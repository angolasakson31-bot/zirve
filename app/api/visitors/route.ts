import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { DailyVisitor } from '@/models/DailyVisitor';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-ip';

export const runtime = 'nodejs';

const pingLimit = rateLimit(20);

function todayTr(): string {
  return new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  const rawIp = getClientIp(req);
  if (!pingLimit(rawIp)) return NextResponse.json({ ok: false }, { status: 429 });

  let sessionId: string;
  try {
    const body = await req.json();
    sessionId = typeof body?.sessionId === 'string' ? body.sessionId.slice(0, 64) : '';
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!sessionId) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    await connectDB();
    const date = todayTr();
    // Aynı (date, sessionId) çifti zaten varsa insert edilmez — sayı değişmez
    await DailyVisitor.findOneAndUpdate(
      { date, sessionId },
      { $setOnInsert: { date, sessionId, createdAt: new Date() } },
      { upsert: true },
    );
    const count = await DailyVisitor.countDocuments({ date });
    return NextResponse.json({ ok: true, count });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const count = await DailyVisitor.countDocuments({ date: todayTr() });
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
