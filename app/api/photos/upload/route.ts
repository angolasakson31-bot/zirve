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
import { isPreModerationEnabled } from '@/lib/pre-moderation';

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

interface CloudinaryModerationEntry {
  status?: 'approved' | 'rejected' | 'pending';
  kind?: string;
  response?: { moderation_labels?: { Name: string; Confidence: number }[] };
}

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  moderation?: CloudinaryModerationEntry[];
}

// Cloudinary moderation add-on (aws_rek, webpurify, vb.). CLOUDINARY_MODERATION
// env değişkeni boşsa moderation kapalı kalır; istemci dashboard'dan add-on'u
// etkinleştirip env değişkenini set edince devreye girer.
const MODERATION = process.env.CLOUDINARY_MODERATION || '';

async function uploadToCloudinary(buffer: Buffer): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const options: Record<string, unknown> = { folder: 'zirve', resource_type: 'image' };
    if (MODERATION) options.moderation = MODERATION;
    cloudinary.uploader.upload_stream(
      options,
      (err, result) => {
        if (err || !result) return reject(err);
        resolve(result as CloudinaryUploadResult);
      }
    ).end(buffer);
  });
}

function evaluateModeration(result: CloudinaryUploadResult): {
  status: 'pending' | 'approved' | 'rejected';
  labels: string[];
} {
  const entries = result.moderation ?? [];
  if (entries.length === 0) {
    return { status: 'approved', labels: [] };
  }
  const labels: string[] = [];
  let status: 'pending' | 'approved' | 'rejected' = 'approved';
  for (const e of entries) {
    if (e.status === 'rejected') status = 'rejected';
    else if (e.status === 'pending' && status !== 'rejected') status = 'pending';
    const mLabels = e.response?.moderation_labels;
    if (Array.isArray(mLabels)) {
      for (const l of mLabels) if (l?.Name) labels.push(l.Name);
    }
  }
  return { status, labels };
}

async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch {
    // Sessizce yoksay — yine de DB'ye kaydedilmedi.
  }
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
    const moderation = evaluateModeration(mainResult);

    // Eğer Cloudinary açıkça reddetmişse, fotoğrafı yayına alma ve Cloudinary'den sil.
    if (moderation.status === 'rejected') {
      await deleteFromCloudinary(mainResult.public_id);
      return NextResponse.json({
        error: 'Yüklenen içerik kurallarımıza aykırı bulundu ve kabul edilmedi.',
      }, { status: 422 });
    }

    const albumResults: string[] = [];
    for (const f of rawFiles.slice(1)) {
      try {
        const buf = Buffer.from(await f.arrayBuffer());
        const result = await uploadToCloudinary(buf);
        const m = evaluateModeration(result);
        if (m.status === 'rejected') {
          await deleteFromCloudinary(result.public_id);
          continue;
        }
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

    // Pre-moderation (admin toggle) açık ise Cloudinary moderation sonucundan
    // bağımsız olarak fotoğrafı bekleyen kuyruğa al. Kapalı ise mevcut akış:
    // Cloudinary moderation 'pending' dönerse yine bekletilir.
    const adminPreModeration = await isPreModerationEnabled();
    const finalStatus: 'pending' | 'approved' | 'rejected' =
      adminPreModeration ? 'pending' : moderation.status;
    const finalIsHidden = adminPreModeration || moderation.status === 'pending';

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
      moderationStatus: finalStatus,
      moderationLabels: moderation.labels,
      isHidden: finalIsHidden,
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
