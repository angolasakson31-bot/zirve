import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import BannedIP from '@/models/BannedIP';
import { rateLimit } from '@/lib/rate-limit';
import { hashIp } from '@/lib/hash-ip';
import { getClientIp } from '@/lib/get-ip';

export const runtime = 'nodejs';

const checkLimit = rateLimit(10);
const MAX_COMMENTS = 500;

export async function POST(req: NextRequest) {
  const rawIp = getClientIp(req);
  if (!checkLimit(rawIp))
    return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429 });

  try {
    const { photoId, text } = await req.json();
    if (!photoId || typeof text !== 'string')
      return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
    if (!mongoose.Types.ObjectId.isValid(photoId))
      return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });

    const trimmed = text.trim().replace(/<[^>]*>/g, '').slice(0, 60);
    if (!trimmed)
      return NextResponse.json({ error: 'Yorum boş olamaz.' }, { status: 400 });

    await connectDB();

    const ip = hashIp(rawIp);
    const banned = await BannedIP.exists({ ip });
    if (banned) return NextResponse.json({ error: 'Erişiminiz kısıtlanmıştır.' }, { status: 403 });

    const photo = await Photo.findOneAndUpdate(
      { _id: photoId, isArchived: false, $expr: { $lt: [{ $size: '$comments' }, MAX_COMMENTS] } },
      { $push: { comments: { text: trimmed, userHash: ip, createdAt: new Date() } } },
      { new: true }
    ).select('comments');

    if (!photo)
      return NextResponse.json({ error: 'Fotoğraf bulunamadı.' }, { status: 404 });

    // userHash'i response'dan çıkar
    const safeComments = photo.comments.map((c: { text: string; createdAt: Date }) => ({
      text: c.text,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ comments: safeComments });
  } catch {
    return NextResponse.json({ error: 'Yorum eklenemedi.' }, { status: 500 });
  }
}
