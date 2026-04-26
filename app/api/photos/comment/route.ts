import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const checkLimit = rateLimit(10);

function hashIp(ip: string): string {
  return createHash('md5').update(ip).digest('hex').slice(0, 8);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '0.0.0.0';
  if (!checkLimit(ip))
    return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429 });

  try {
    const { photoId, text } = await req.json();
    if (!photoId || typeof text !== 'string')
      return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });

    const trimmed = text.trim().slice(0, 60);
    if (!trimmed)
      return NextResponse.json({ error: 'Yorum boş olamaz.' }, { status: 400 });

    await connectDB();

    const photo = await Photo.findOneAndUpdate(
      { _id: photoId, isArchived: false },
      { $push: { comments: { text: trimmed, userHash: hashIp(ip), createdAt: new Date() } } },
      { new: true }
    ).select('comments');

    if (!photo)
      return NextResponse.json({ error: 'Fotoğraf bulunamadı.' }, { status: 404 });

    return NextResponse.json({ comments: photo.comments });
  } catch {
    return NextResponse.json({ error: 'Yorum eklenemedi.' }, { status: 500 });
  }
}
