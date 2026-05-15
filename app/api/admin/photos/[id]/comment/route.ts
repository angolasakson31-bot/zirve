import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';

export const runtime = 'nodejs';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkAdmin(req);
  if (authErr !== null) return NextResponse.json({ error: authErr === 429 ? 'Çok fazla istek.' : 'Yetkisiz.' }, { status: authErr });
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
