import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { connectDB } from '@/lib/mongoose';
import cloudinary from '@/lib/cloudinary';
import Photo from '@/models/Photo';

export const runtime = 'nodejs';

function auth(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'ZRV-';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const contactInfo = ((formData.get('contactInfo') as string | null) ?? '').trim();

    if (!file) return NextResponse.json({ error: 'Dosya bulunamadı.' }, { status: 400 });
    if (file.size > 10 * 1024 * 1024)
      return NextResponse.json({ error: 'Maksimum 10MB.' }, { status: 400 });

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type))
      return NextResponse.json({ error: 'Sadece JPEG, PNG veya WebP.' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileHash = createHash('sha256').update(buffer).digest('hex');

    await connectDB();

    const duplicate = await Photo.exists({ fileHash });
    if (duplicate)
      return NextResponse.json({ error: 'Bu fotoğraf zaten yüklenmiş.' }, { status: 409 });

    const uploadResult = await new Promise<{ public_id: string; secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'zirve', resource_type: 'image' },
        (err, result) => {
          if (err || !result) return reject(err);
          resolve(result as { public_id: string; secure_url: string });
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
      uploaderIp: 'admin',
      contactInfo: contactInfo || 'Admin',
      trackingCode,
      fileHash,
    });

    return NextResponse.json({ photo, trackingCode }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Yükleme başarısız.' }, { status: 500 });
  }
}
