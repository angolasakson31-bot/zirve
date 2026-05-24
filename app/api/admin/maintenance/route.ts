import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { connectDB } from '@/lib/mongoose';
import SiteSettings from '@/models/SiteSettings';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const key      = req.nextUrl.searchParams.get('key') ?? '';
  const mode     = req.nextUrl.searchParams.get('mode');
  const expected = process.env.ADMIN_PASSWORD ?? '';

  if (
    !expected ||
    key.length !== expected.length ||
    !timingSafeEqual(Buffer.from(key), Buffer.from(expected))
  ) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });
  }

  if (mode !== 'on' && mode !== 'off') {
    return NextResponse.json({ error: 'mode=on veya mode=off olmalı.' }, { status: 400 });
  }

  await connectDB();
  await SiteSettings.findOneAndUpdate(
    { key: 'maintenanceMode' },
    { value: mode === 'on' },
    { upsert: true },
  );

  return NextResponse.json({ maintenance: mode === 'on', message: mode === 'on' ? 'Bakım modu açıldı.' : 'Bakım modu kapatıldı.' });
}
