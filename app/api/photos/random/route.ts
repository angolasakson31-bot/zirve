import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '0.0.0.0';
    await connectDB();

    // Kullanıcının daha önce oylamadığı, şampiyon olmayan rastgele bir fotoğraf
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
