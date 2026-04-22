import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { connectDB } from '@/lib/mongoose';
import cloudinary from '@/lib/cloudinary';
import Photo from '@/models/Photo';
import BannedIP from '@/models/BannedIP';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const checkLimit = rateLimit(5);
const DAILY_UPLOAD_LIMIT = 7;
const MAX_ALBUM_SIZE = 3;

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'ZRV-';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
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
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '0.0.0.0';
  if (!checkLimit(ip))
    return NextResponse.json({ error: 'Çok fazla istek. Lütfen bekleyin.' }, { status: 429 });

  try {
    const formData = await req.formData();
    const contactInfo = (formData.get('contactInfo') as string | null)?.trim() ?? '';
    if (!contactInfo) return NextResponse.json({ error: 'İletişim bilgisi zorunludur.' }, { status: 400 });
    if (contactInfo.length > 200) return NextResponse.json({ error: 'İletişim bilgisi en fazla 200 karakter.' }, { status: 400 });

    const rawFiles = formData.getAll('files') as File[];
    if (!rawFiles.length) return NextResponse.json({ error: 'Dosya bulunamadı.' }, { status: 400 });
    if (rawFiles.length > MAX_ALBUM_SIZE)
      return NextResponse.json({ error: `En fazla ${MAX_ALBUM_SIZE} fotoğraf yükleyebilirsiniz.` }, { status: 400 });

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    for (const f of rawFiles) {
      if (f.size > 10 * 1024 * 1024)
        return NextResponse.json({ error: 'Her fotoğraf en fazla 10MB olabilir.' }, { status: 400 });
      if (!allowedTypes.includes(f.type))
        return NextResponse.json({ error: 'Sadece JPEG, PNG veya WebP yükleyebilirsiniz.' }, { status: 400 });
    }

    await connectDB();

    const banned = await BannedIP.exists({ ip });
    if (banned) return NextResponse.json({ error: 'Yükleme erişiminiz kısıtlanmıştır.' }, { status: 403 });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayCount = await Photo.countDocuments({ uploaderIp: ip, createdAt: { $gte: startOfDay } });
    if (todayCount >= DAILY_UPLOAD_LIMIT)
      return NextResponse.json({ error: `Bugün en fazla ${DAILY_UPLOAD_LIMIT} yükleme yapabilirsiniz.` }, { status: 429 });

    // Duplicate check for first (main) file
    const mainBuffer = Buffer.from(await rawFiles[0].arrayBuffer());
    const fileHash = createHash('sha256').update(mainBuffer).digest('hex');
    const duplicate = await Photo.exists({ fileHash });
    if (duplicate) return NextResponse.json({ error: 'Bu fotoğraf zaten yüklenmiş.' }, { status: 409 });

    // Upload all files to Cloudinary
    const mainResult = await uploadToCloudinary(mainBuffer);
    const albumResults: string[] = [];
    for (const f of rawFiles.slice(1)) {
      try {
        const buf = Buffer.from(await f.arrayBuffer());
        const result = await uploadToCloudinary(buf);
        albumResults.push(result.secure_url);
      } catch {
        // Hata olan albüm fotoğrafını atla
      }
    }

    let trackingCode = generateCode();
    let attempts = 0;
    while (await Photo.exists({ trackingCode }) && attempts++ < 5) {
      trackingCode = generateCode();
    }

    const photo = await Photo.create({
      cloudinaryId: mainResult.public_id,
      url: mainResult.secure_url,
      albumUrls: albumResults,
      uploaderIp: ip,
      contactInfo,
      trackingCode,
      fileHash,
    });

    return NextResponse.json({ photo, trackingCode }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Yükleme başarısız.' }, { status: 500 });
  }
}
