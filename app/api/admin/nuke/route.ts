import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongoose';
import cloudinary from '@/lib/cloudinary';
import Photo from '@/models/Photo';
import { invalidateLeaderCache } from '@/lib/leader-cache';

export const runtime = 'nodejs';

export async function DELETE(req: NextRequest) {
  const authErr = checkAdmin(req);
  if (authErr !== null) return NextResponse.json({ error: authErr === 429 ? 'Çok fazla istek.' : 'Yetkisiz.' }, { status: authErr });
  if (req.headers.get('x-confirm') !== 'DELETE_ALL')
    return NextResponse.json({ error: 'Onay başlığı eksik.' }, { status: 400 });

  await connectDB();
  const all = await Photo.find({}).select('cloudinaryId');

  await Promise.all(
    all.map(p => cloudinary.uploader.destroy(p.cloudinaryId).catch(() => null))
  );

  await Photo.deleteMany({});

  invalidateLeaderCache();
  return NextResponse.json({ ok: true, deleted: all.length });
}
