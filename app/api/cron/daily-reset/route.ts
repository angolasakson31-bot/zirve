import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { connectDB } from '@/lib/mongoose';
import { runDailyReset } from '@/lib/daily-reset';
import { anonymizeOldPersonalData } from '@/lib/kvkk-retention';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? '';
  const expected = process.env.CRON_SECRET ?? '';
  if (!expected) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });
  }
  const secretBuf = Buffer.from(secret);
  const expectedBuf = Buffer.from(expected);
  const valid = secretBuf.length === expectedBuf.length &&
    timingSafeEqual(secretBuf, expectedBuf);
  if (!valid) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });
  }

  try {
    await connectDB();

    // Sayfa isteklerindeki sıfırlamayla aynı mantık (şampiyonu dünün zirvesine
    // taşı, stale state'i temizle, eski fotoğrafları arşivle). İdempotent.
    const reset = await runDailyReset();

    // KVKK: 2 yıldan eski kişisel verileri anonimleştir + Cloudinary'den sil.
    // Hata olursa ana akış etkilenmesin ama bilgilendir.
    let anonymized = 0;
    let cloudinaryDeleted = 0;
    let cloudinaryFailed = 0;
    let anonymizeError: string | null = null;
    try {
      const r = await anonymizeOldPersonalData();
      anonymized = r.anonymized;
      cloudinaryDeleted = r.cloudinaryDeleted;
      cloudinaryFailed = r.cloudinaryFailed;
      console.log(`[kvkk] anonymized=${anonymized} cloudinaryDeleted=${cloudinaryDeleted} cloudinaryFailed=${cloudinaryFailed}`);
    } catch (err) {
      anonymizeError = err instanceof Error ? err.message : 'unknown';
      console.error('[kvkk] anonymize error:', err);
    }

    return NextResponse.json({
      ok: true,
      champion: reset.championId,
      archived: reset.archived,
      anonymized,
      cloudinaryDeleted,
      cloudinaryFailed,
      anonymizeError,
    });
  } catch {
    return NextResponse.json({ error: 'Sıfırlama başarısız.' }, { status: 500 });
  }
}
