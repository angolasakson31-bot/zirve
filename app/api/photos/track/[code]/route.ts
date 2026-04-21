import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import { rateLimit } from '@/lib/rate-limit';

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

    const startOfDay = new Date(photo.createdAt);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

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
