import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import { hashIp } from '@/lib/hash-ip';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkAdmin(req);
  if (authErr !== null) return NextResponse.json({ error: authErr === 429 ? 'Çok fazla istek.' : 'Yetkisiz.' }, { status: authErr });
  const { id } = await params;
  const { text } = await req.json();

  if (!text || typeof text !== 'string')
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });

  const trimmed = text.trim().slice(0, 60);
  if (!trimmed) return NextResponse.json({ error: 'Yorum boş olamaz.' }, { status: 400 });

  await connectDB();

  const photo = await Photo.findByIdAndUpdate(
    id,
    { $push: { comments: { text: trimmed, userHash: hashIp('admin-panel'), createdAt: new Date() } } },
    { new: true }
  ).select('comments');

  if (!photo) return NextResponse.json({ error: 'Bulunamadı.' }, { status: 404 });

  return NextResponse.json({ ok: true, comments: photo.comments });
}

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
