import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
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
  const { commentId } = await req.json();

  if (!commentId) return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });

  await connectDB();

  const photo = await Photo.findByIdAndUpdate(
    id,
    { $pull: { comments: { _id: commentId } } },
    { new: true }
  ).select('comments');

  if (!photo) return NextResponse.json({ error: 'Bulunamadı.' }, { status: 404 });

  return NextResponse.json({ ok: true, comments: photo.comments });
}
