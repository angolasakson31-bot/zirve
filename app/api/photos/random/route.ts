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

    const [photo] = await Photo.aggregate([
      { $match: { voters: { $nin: [ip] }, isChampion: false } },
      { $sample: { size: 1 } },
    ]);

    if (!photo) return NextResponse.json({ photo: null });
    return NextResponse.json({ photo });
  } catch {
    return NextResponse.json({ error: 'Fotoğraf alınamadı.' }, { status: 500 });
  }
}
