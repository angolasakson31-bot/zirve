import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { connectDB } from '@/lib/mongoose';
import SiteSettings from '@/models/SiteSettings';
import { resetMaintenanceCache } from '@/lib/maintenanceMode';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string; mode: string }> },
) {
  const { token, mode } = await params;
  const expected = process.env.ADMIN_PASSWORD ?? '';

  if (
    !expected ||
    token.length !== expected.length ||
    !timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  ) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });
  }

  if (mode !== 'on' && mode !== 'off') {
    return NextResponse.json({ error: 'on veya off olmalı.' }, { status: 400 });
  }

  await connectDB();
  await SiteSettings.findOneAndUpdate(
    { key: 'maintenanceMode' },
    { value: mode === 'on' },
    { upsert: true },
  );

  resetMaintenanceCache();

  return NextResponse.json({
    maintenance: mode === 'on',
    message: mode === 'on' ? 'Bakım modu açıldı.' : 'Bakım modu kapatıldı.',
  });
}
