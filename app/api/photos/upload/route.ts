import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { connectDB } from '@/lib/mongoose';
import cloudinary from '@/lib/cloudinary';
import Photo from '@/models/Photo';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const checkLimit = rateLimit(5);
const DAILY_UPLOAD_LIMIT = 5;

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'ZRV-';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '0.0.0.0';
  if (!checkLimit(ip))
    return NextResponse.json({ error: 'Çok fazla istek. Lütfen bekleyin.' }, { status: 429 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'Dosya bulunamadı.' }, { status: 400 });

    if (file.size > 10 * 1024 * 1024)
      return NextResponse.json({ error: 'Maksimum 10MB yükleyebilirsiniz.' }, { status: 400 });

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type))
      return NextResponse.json({ error: 'Sadece JPEG, PNG veya WebP yükleyebilirsiniz.' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // SHA-256 duplicate check
    const fileHash = createHash('sha256').update(buffer).digest('hex');

    await connectDB();

    const duplicate = await Photo.exists({ fileHash });
    if (duplicate)
      return NextResponse.json({ error: 'Bu fotoğraf zaten yüklenmiş.' }, { status: 409 });

    // Daily IP limit
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayCount = await Photo.countDocuments({ uploaderIp: ip, createdAt: { $gte: startOfDay } });
    if (todayCount >= DAILY_UPLOAD_LIMIT)
      return NextResponse.json({ error: `Bugün en fazla ${DAILY_UPLOAD_LIMIT} fotoğraf yükleyebilirsiniz.` }, { status: 429 });

    const uploadResult = await new Promise<{ public_id: string; secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'zirve', resource_type: 'image' },
        (err, result) => {
          if (err || !result) return reject(err);
          resolve(result as any);
        }
      ).end(buffer);
    });

    let trackingCode = generateCode();
    let attempts = 0;
    while (await Photo.exists({ trackingCode }) && attempts++ < 5) {
      trackingCode = generateCode();
    }

    const photo = await Photo.create({
      cloudinaryId: uploadResult.public_id,
      url: uploadResult.secure_url,
      uploaderIp: ip,
      trackingCode,
      fileHash,
    });

    return NextResponse.json({ photo, trackingCode }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Yükleme başarısız.' }, { status: 500 });
  }
}
