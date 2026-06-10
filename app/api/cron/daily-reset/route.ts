import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import { toTurkishDateStr, turkishStartOfDay } from '@/lib/daily-reset';

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

    // Sadece dünden önce yüklenmiş (bugünün başlangıcından önce oluşturulmuş) fotoğrafları arşivle.
    // Bu, cron birden fazla çağrılırsa bugünün yüklenenlerini yanlışlıkla arşivlemekten korur.
    const cutoff = turkishStartOfDay();

    const leader = await Photo.findOne({ isChampion: true, createdAt: { $lt: cutoff } });
    if (leader) {
      leader.championDate = toTurkishDateStr(leader.createdAt as Date);
      leader.isChampion = false;
      await leader.save();
    }

    const result = await Photo.updateMany(
      { isArchived: false, createdAt: { $lt: cutoff } },
      { $set: { isArchived: true } }
    );

    return NextResponse.json({
      ok: true,
      champion: leader?._id ?? null,
      archived: result.modifiedCount,
    });
  } catch {
    return NextResponse.json({ error: 'Sıfırlama başarısız.' }, { status: 500 });
  }
}
