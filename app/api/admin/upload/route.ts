import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { createHash, randomBytes } from 'crypto';
import { connectDB } from '@/lib/mongoose';
import cloudinary from '@/lib/cloudinary';
import Photo from '@/models/Photo';

export const runtime = 'nodejs';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  const bytes = randomBytes(5);
  return 'ZRV-' + Array.from(bytes).map(b => CHARS[b % CHARS.length]).join('');
}

async function uploadToCloudinary(buffer: Buffer): Promise<{ public_id: string; secure_url: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'zirve', resource_type: 'image' },
      (err, result) => {
        if (err || !result) return reject(err);
        resolve(result as { public_id: string; secure_url: string });
      }
    ).end(buffer);
  });
}

export async function POST(req: NextRequest) {
  const authErr = checkAdmin(req);
  if (authErr !== null) return NextResponse.json({ error: authErr === 429 ? 'Çok fazla istek.' : 'Yetkisiz.' }, { status: authErr });

  try {
    const formData = await req.formData();
    const rawFiles = formData.getAll('files') as File[];
    const contactInfo = ((formData.get('contactInfo') as string | null) ?? '').trim();

    if (!rawFiles.length) return NextResponse.json({ error: 'Dosya bulunamadı.' }, { status: 400 });

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    for (const f of rawFiles) {
      if (f.size > 10 * 1024 * 1024)
        return NextResponse.json({ error: 'Maksimum 10MB.' }, { status: 400 });
      if (!allowedTypes.includes(f.type))
        return NextResponse.json({ error: 'Sadece JPEG, PNG veya WebP.' }, { status: 400 });
    }

    const mainBuffer = Buffer.from(await rawFiles[0].arrayBuffer());
    const fileHash = createHash('sha256').update(mainBuffer).digest('hex');

    await connectDB();

    const duplicate = await Photo.exists({ fileHash });
    if (duplicate)
      return NextResponse.json({ error: 'Bu fotoğraf zaten yüklenmiş.' }, { status: 409 });

    const mainResult = await uploadToCloudinary(mainBuffer);

    const albumUrls: string[] = [];
    for (const f of rawFiles.slice(1)) {
      try {
        const buf = Buffer.from(await f.arrayBuffer());
        const result = await uploadToCloudinary(buf);
        albumUrls.push(result.secure_url);
      } catch {}
    }

    let trackingCode = generateCode();
    let attempts = 0;
    while (await Photo.exists({ trackingCode }) && attempts++ < 5) {
      trackingCode = generateCode();
    }

    const photo = await Photo.create({
      cloudinaryId: mainResult.public_id,
      url: mainResult.secure_url,
      albumUrls,
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
