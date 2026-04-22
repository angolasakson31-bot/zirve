import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import { rateLimit } from '@/lib/rate-limit';
import { toTurkishDateStr } from '@/lib/daily-reset';

export const runtime = 'nodejs';

const checkLimit = rateLimit(20);

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '0.0.0.0';
  if (!checkLimit(ip))
    return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429 });

  try {
    const { code } = await params;
    await connectDB();

    const photo = await Photo.findOne({ trackingCode: code.toUpperCase() })
      .select('url voteCount average likeCount dislikeCount isChampion createdAt isArchived');

    if (!photo) return NextResponse.json({ error: 'Kod bulunamadı.' }, { status: 404 });

    const TZ = 3 * 60 * 60 * 1000;
    const trDate = toTurkishDateStr(photo.createdAt as Date);
    const [y, m, d] = trDate.split('-').map(Number);
    const startOfDay = new Date(Date.UTC(y, m - 1, d) - TZ);
    const endOfDay   = new Date(Date.UTC(y, m - 1, d + 1) - TZ);

    const [totalToday, betterCount] = await Promise.all([
      Photo.countDocuments({ createdAt: { $gte: startOfDay, $lt: endOfDay } }),
      Photo.countDocuments({
        createdAt: { $gte: startOfDay, $lt: endOfDay },
        average: { $gt: photo.average },
      }),
    ]);

    const rank = betterCount + 1;

    return NextResponse.json({ photo, rank, totalToday });
  } catch {
    return NextResponse.json({ error: 'Hata oluştu.' }, { status: 500 });
  }
}
