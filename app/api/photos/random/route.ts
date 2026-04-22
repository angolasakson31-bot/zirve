import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import { rateLimit } from '@/lib/rate-limit';
import { maybeRunDailyReset } from '@/lib/daily-reset';

export const runtime = 'nodejs';

const checkLimit = rateLimit(60);

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '0.0.0.0';
  if (!checkLimit(ip))
    return NextResponse.json({ error: 'Çok fazla istek. Lütfen bekleyin.' }, { status: 429 });

  try {
    await connectDB();
    await maybeRunDailyReset();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const excludeParam = req.nextUrl.searchParams.get('exclude') ?? '';
    const excludeObjectIds = excludeParam
      .split(',')
      .slice(0, 500) // max 500 ID
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    const match: Record<string, unknown> = {
      voters: { $nin: [ip] },
      uploaderIp: { $ne: ip },
      isArchived: false,
      createdAt: { $gte: startOfDay },
    };

    if (excludeObjectIds.length > 0) {
      match._id = { $nin: excludeObjectIds };
    }

    const [photo] = await Photo.aggregate([
      { $match: match },
      { $sample: { size: 1 } },
    ]);

    if (!photo) return NextResponse.json({ photo: null });
    // albumUrls aggregate döndürmeyebilir, güvenli al
    return NextResponse.json({ photo: { ...photo, albumUrls: photo.albumUrls ?? [] } });
  } catch (err) {
    console.error('random route error:', err);
    return NextResponse.json({ error: 'Fotoğraf alınamadı.' }, { status: 500 });
  }
}
