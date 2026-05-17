import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';

export const runtime = 'nodejs';

export async function GET() {
  try { await connectDB(); } catch {}
  return NextResponse.json({ ok: true, ts: Date.now() });
}
