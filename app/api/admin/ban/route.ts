import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import BannedIP from '@/models/BannedIP';

export const runtime = 'nodejs';

function auth(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });
  const { ip } = await req.json();
  if (!ip) return NextResponse.json({ error: 'IP gerekli.' }, { status: 400 });
  await connectDB();
  await BannedIP.updateOne({ ip }, { ip }, { upsert: true });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });
  const { ip } = await req.json();
  if (!ip) return NextResponse.json({ error: 'IP gerekli.' }, { status: 400 });
  await connectDB();
  await BannedIP.deleteOne({ ip });
  return NextResponse.json({ ok: true });
}
