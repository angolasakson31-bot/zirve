import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongoose';
import cloudinary from '@/lib/cloudinary';
import Photo from '@/models/Photo';
import DeletedPhoto from '@/models/DeletedPhoto';
import { invalidateLeaderCache } from '@/lib/leader-cache';

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

  let reason = 'Uygunsuz fotoğraf';
  try {
    const body = await req.json();
    if (body?.reason && typeof body.reason === 'string') {
      reason = body.reason;
    }
  } catch {
    // no body or invalid JSON — use default reason
  }

  // Create tombstone
  try {
    await DeletedPhoto.create({
      trackingCode: photo.trackingCode,
      reason,
    });
  } catch {
    // If tombstone already exists (duplicate), ignore
  }

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

  invalidateLeaderCache();
  return NextResponse.json({ ok: true });
}
