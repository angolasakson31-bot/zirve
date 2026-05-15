import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongoose';
import cloudinary from '@/lib/cloudinary';
import Photo from '@/models/Photo';

export const runtime = 'nodejs';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkAdmin(req);
  if (authErr !== null) return NextResponse.json({ error: authErr === 429 ? 'Çok fazla istek.' : 'Yetkisiz.' }, { status: authErr });
  const { id } = await params;
  await connectDB();
  const photo = await Photo.findById(id);
  if (!photo) return NextResponse.json({ error: 'Bulunamadı.' }, { status: 404 });

  const wasChampion = photo.isChampion;

  await cloudinary.uploader.destroy(photo.cloudinaryId);
  await photo.deleteOne();

  if (wasChampion) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const next = await Photo.findOne({
      isChampion: false,
      isArchived: false,
      championDate: null,
      voteCount: { $gte: 3 },
      createdAt: { $gte: startOfDay },
    }).sort({ average: -1, voteCount: -1 });
    if (next) {
      next.isChampion = true;
      await next.save();
    }
  }

  return NextResponse.json({ ok: true });
}
