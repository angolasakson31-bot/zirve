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
  if (!ip || typeof ip !== 'string') return NextResponse.json({ error: 'IP gerekli.' }, { status: 400 });
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$|^[0-9a-f:]+$/i;
  if (!ipRegex.test(ip.trim())) return NextResponse.json({ error: 'Geçersiz IP formatı.' }, { status: 400 });
  await connectDB();
  await BannedIP.updateOne({ ip: ip.trim() }, { ip: ip.trim() }, { upsert: true });
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
