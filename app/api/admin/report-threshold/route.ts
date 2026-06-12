import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import {
  getReportAutoHideThreshold,
  setReportAutoHideThreshold,
  MIN_THRESHOLD,
  MAX_THRESHOLD,
} from '@/lib/report-threshold';

export const runtime = 'nodejs';

// GET → mevcut eşik değeri
export async function GET(req: NextRequest) {
  const authErr = checkAdmin(req);
  if (authErr !== null)
    return NextResponse.json(
      { error: authErr === 429 ? 'Çok fazla istek.' : 'Yetkisiz.' },
      { status: authErr },
    );

  const threshold = await getReportAutoHideThreshold();
  return NextResponse.json({
    threshold,
    min: MIN_THRESHOLD,
    max: MAX_THRESHOLD,
  });
}

// POST → eşik değerini güncelle ({ threshold: number })
export async function POST(req: NextRequest) {
  const authErr = checkAdmin(req);
  if (authErr !== null)
    return NextResponse.json(
      { error: authErr === 429 ? 'Çok fazla istek.' : 'Yetkisiz.' },
      { status: authErr },
    );

  try {
    const body = await req.json();
    const raw = body?.threshold;
    if (typeof raw !== 'number' || !Number.isFinite(raw))
      return NextResponse.json({ error: 'Geçersiz eşik.' }, { status: 400 });
    const value = await setReportAutoHideThreshold(raw);
    return NextResponse.json({ ok: true, threshold: value });
  } catch {
    return NextResponse.json({ error: 'İşlem başarısız.' }, { status: 500 });
  }
}
