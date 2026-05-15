import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongoose';
import BannedIP from '@/models/BannedIP';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const authErr = checkAdmin(req);
  if (authErr !== null) return NextResponse.json({ error: authErr === 429 ? 'Çok fazla istek.' : 'Yetkisiz.' }, { status: authErr });
  const { ip } = await req.json();
  if (!ip || typeof ip !== 'string') return NextResponse.json({ error: 'IP gerekli.' }, { status: 400 });
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$|^[0-9a-f:]+$/i;
  if (!ipRegex.test(ip.trim())) return NextResponse.json({ error: 'Geçersiz IP formatı.' }, { status: 400 });
  await connectDB();
  await BannedIP.updateOne({ ip: ip.trim() }, { ip: ip.trim() }, { upsert: true });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const authErr = checkAdmin(req);
  if (authErr !== null) return NextResponse.json({ error: authErr === 429 ? 'Çok fazla istek.' : 'Yetkisiz.' }, { status: authErr });
  const { ip } = await req.json();
  if (!ip) return NextResponse.json({ error: 'IP gerekli.' }, { status: 400 });
  await connectDB();
  await BannedIP.deleteOne({ ip });
  return NextResponse.json({ ok: true });
}
