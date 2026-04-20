import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const checkLimit = rateLimit(60);

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '0.0.0.0';
  if (!checkLimit(ip))
    return NextResponse.json({ error: 'Çok fazla istek. Lütfen bekleyin.' }, { status: 429 });

  try {
    await connectDB();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const excludeParam = req.nextUrl.searchParams.get('exclude') ?? '';
    const excludeIds = excludeParam ? excludeParam.split(',').filter(Boolean) : [];

    const match: Record<string, unknown> = {
      voters: { $nin: [ip] },
      isChampion: false,
      createdAt: { $gte: startOfDay },
    };

    if (excludeIds.length > 0) {
      match._id = { $nin: excludeIds };
    }

    const [photo] = await Photo.aggregate([
      { $match: match },
      { $sample: { size: 1 } },
    ]);

    if (!photo) return NextResponse.json({ photo: null });
    return NextResponse.json({ photo });
  } catch {
    return NextResponse.json({ error: 'Fotoğraf alınamadı.' }, { status: 500 });
  }
}
