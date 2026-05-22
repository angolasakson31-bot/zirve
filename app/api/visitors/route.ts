import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Visitor } from '@/models/Visitor';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const pingLimit = rateLimit(20);

export async function POST(req: NextRequest) {
  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '0.0.0.0';
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
    await Visitor.findOneAndUpdate(
      { sessionId },
      { lastSeen: new Date() },
      { upsert: true },
    );
    const count = await Visitor.countDocuments();
    return NextResponse.json({ ok: true, count });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const count = await Visitor.countDocuments();
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
