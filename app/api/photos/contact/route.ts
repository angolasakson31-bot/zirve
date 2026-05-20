import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const checkLimit = rateLimit(30);

export async function GET(req: NextRequest) {
  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '0.0.0.0';
  if (!checkLimit(rawIp))
    return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429 });

  const dt = req.nextUrl.searchParams.get('dt') ?? '';
  const id = req.nextUrl.searchParams.get('id') ?? '';

  if (!dt || !/^[0-9a-f]{32}$/.test(dt))
    return NextResponse.json({ contactInfo: null }, { status: 403 });
  if (!id || !mongoose.Types.ObjectId.isValid(id))
    return NextResponse.json({ contactInfo: null }, { status: 400 });

  await connectDB();

  // Sadece fotoğraf yüklemiş cihazlar görebilir
  const hasUploaded = await Photo.exists({ uploaderDevice: dt });
  if (!hasUploaded)
    return NextResponse.json({ contactInfo: null }, { status: 403 });

  // Sadece şampiyon veya dünkü şampiyon fotoğrafların iletişim bilgisi açılabilir
  const photo = await Photo.findOne({
    _id: id,
    $or: [{ isChampion: true }, { championDate: { $exists: true, $ne: null } }],
  }).select('contactInfo').lean<{ contactInfo?: string }>();

  if (!photo)
    return NextResponse.json({ contactInfo: null }, { status: 403 });

  return NextResponse.json({ contactInfo: photo.contactInfo ?? null });
}
