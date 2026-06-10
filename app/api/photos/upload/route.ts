import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import sharp from 'sharp';
import { connectDB } from '@/lib/mongoose';
import cloudinary from '@/lib/cloudinary';
import Photo from '@/models/Photo';
import BannedIP from '@/models/BannedIP';
import { rateLimit } from '@/lib/rate-limit';
import { turkishStartOfDay } from '@/lib/daily-reset';
import { hashIp } from '@/lib/hash-ip';
import { getClientIp } from '@/lib/get-ip';

export const runtime = 'nodejs';

const checkLimit = rateLimit(5);
const DAILY_UPLOAD_LIMIT = 7;
const MAX_ALBUM_SIZE = 3;

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  const bytes = randomBytes(5);
  return 'ZRV-' + Array.from(bytes).map(b => CHARS[b % CHARS.length]).join('');
}

function sanitizeContactInfo(info: string): string {
  return info.replace(/<[^>]*>/g, '').replace(/[<>"'`]/g, '').trim().slice(0, 200);
}

async function generateBlurPlaceholder(buf: Buffer): Promise<string> {
  try {
    const out = await sharp(buf)
      .resize(10, 10, { fit: 'inside', withoutEnlargement: true })
      .blur(1)
      .png()
      .toBuffer();
    return `data:image/png;base64,${out.toString('base64')}`;
  } catch {
    return '';
  }
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
  const rawIp = getClientIp(req);
  const ip = hashIp(rawIp);
  if (!checkLimit(rawIp))
    return NextResponse.json({ error: 'Çok fazla istek. Lütfen bekleyin.' }, { status: 429 });

  try {
    const formData = await req.formData();
    const rawContact = (formData.get('contactInfo') as string | null) ?? '';
    const contactInfo = sanitizeContactInfo(rawContact);
    const rawDt = (formData.get('deviceToken') as string | null) ?? '';
    const uploaderDevice = /^[0-9a-f]{32}$/.test(rawDt) ? rawDt : '';
    if (!contactInfo) return NextResponse.json({ error: 'İletişim bilgisi zorunludur.' }, { status: 400 });

    const rawFiles = formData.getAll('files') as File[];
    if (!rawFiles.length) return NextResponse.json({ error: 'Dosya bulunamadı.' }, { status: 400 });
    if (rawFiles.length > MAX_ALBUM_SIZE)
      return NextResponse.json({ error: `En fazla ${MAX_ALBUM_SIZE} fotoğraf yükleyebilirsiniz.` }, { status: 400 });

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const allowedFormats = new Set(['jpeg', 'png', 'webp']);
    for (const f of rawFiles) {
      if (f.size > 10 * 1024 * 1024)
        return NextResponse.json({ error: 'Her fotoğraf en fazla 10MB olabilir.' }, { status: 400 });
      if (!allowedTypes.includes(f.type))
        return NextResponse.json({ error: 'Sadece JPEG, PNG veya WebP yükleyebilirsiniz.' }, { status: 400 });
    }

    // Gerçek dosya içeriğini doğrula (MIME spoofing engelleyen)
    for (const f of rawFiles) {
      try {
        const buf = Buffer.from(await f.slice(0, 64 * 1024).arrayBuffer()); // ilk 64KB yeterli
        const meta = await sharp(buf).metadata();
        if (!meta.format || !allowedFormats.has(meta.format))
          return NextResponse.json({ error: 'Geçersiz dosya içeriği. Sadece gerçek resim dosyaları kabul edilir.' }, { status: 400 });
      } catch {
        return NextResponse.json({ error: 'Dosya okunamadı veya geçersiz resim.' }, { status: 400 });
      }
    }

    await connectDB();

    const banned = await BannedIP.exists({ ip });
    if (banned) return NextResponse.json({ error: 'Yükleme erişiminiz kısıtlanmıştır.' }, { status: 403 });

    const todayCount = await Photo.countDocuments({ uploaderIp: ip, createdAt: { $gte: turkishStartOfDay() } });
    if (todayCount >= DAILY_UPLOAD_LIMIT)
      return NextResponse.json({ error: `Bugün en fazla ${DAILY_UPLOAD_LIMIT} yükleme yapabilirsiniz.` }, { status: 429 });

    const mainBuffer = Buffer.from(await rawFiles[0].arrayBuffer());
    const fileHash = createHash('sha256').update(mainBuffer).digest('hex');
    const duplicate = await Photo.exists({ fileHash });
    if (duplicate) return NextResponse.json({ error: 'Bu fotoğraf zaten yüklenmiş.' }, { status: 409 });

    const blurPlaceholder = await generateBlurPlaceholder(mainBuffer);

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
      uploaderDevice,
      contactInfo,
      trackingCode,
      fileHash,
      blurPlaceholder,
    });

    return NextResponse.json({
      photo: { _id: photo._id, url: photo.url },
      trackingCode,
    }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Yükleme başarısız.' }, { status: 500 });
  }
}
