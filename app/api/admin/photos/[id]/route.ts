import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import cloudinary from '@/lib/cloudinary';
import Photo from '@/models/Photo';

export const runtime = 'nodejs';

function auth(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!auth(req)) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });
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
