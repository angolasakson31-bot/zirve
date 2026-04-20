import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import cloudinary from '@/lib/cloudinary';
import Photo from '@/models/Photo';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const checkLimit = rateLimit(5); // 5 upload/dakika per IP

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '0.0.0.0';
  if (!checkLimit(ip))
    return NextResponse.json({ error: 'Çok fazla istek. Lütfen bekleyin.' }, { status: 429 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'Dosya bulunamadı.' }, { status: 400 });

    const maxMB = 10;
    if (file.size > maxMB * 1024 * 1024)
      return NextResponse.json({ error: `Maksimum ${maxMB}MB yükleyebilirsiniz.` }, { status: 400 });

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type))
      return NextResponse.json({ error: 'Sadece JPEG, PNG veya WebP yükleyebilirsiniz.' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await new Promise<{ public_id: string; secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'zirve', resource_type: 'image' },
        (err, result) => {
          if (err || !result) return reject(err);
          resolve(result as any);
        }
      ).end(buffer);
    });

    await connectDB();
    const photo = await Photo.create({
      cloudinaryId: uploadResult.public_id,
      url: uploadResult.secure_url,
      uploaderIp: ip,
    });

    return NextResponse.json({ photo }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Yükleme başarısız.' }, { status: 500 });
  }
}
