import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const authErr = checkAdmin(req);
  if (authErr !== null) return NextResponse.json({ error: authErr === 429 ? 'Çok fazla istek.' : 'Yetkisiz.' }, { status: authErr });
  await connectDB();
  // 2 yıllık KVKK retention sonunda anonimleştirilen fotoğrafların url'i ''
  // olur ve Cloudinary'den silinir. Bunları admin grid'de gösterme — broken
  // <img> render'ı önler ve gereksiz yere PII alanlarını gözden geçirmez.
  const photos = await Photo.find({ url: { $ne: '' } })
    .sort({ createdAt: -1 })
    .select('_id url albumUrls cloudinaryId uploaderIp average voteCount totalScore isChampion isArchived createdAt trackingCode contactInfo championDate comments')
    .lean();
  return NextResponse.json({ photos });
}
