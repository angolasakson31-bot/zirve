import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import cloudinary from '@/lib/cloudinary';
import Photo from '@/models/Photo';

export const runtime = 'nodejs';

function auth(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

export async function DELETE(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });

  await connectDB();
  const all = await Photo.find({}).select('cloudinaryId');

  await Promise.all(
    all.map(p => cloudinary.uploader.destroy(p.cloudinaryId).catch(() => null))
  );

  await Photo.deleteMany({});

  return NextResponse.json({ ok: true, deleted: all.length });
}
