import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { checkAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';

export const runtime = 'nodejs';

// POST → fotoğrafı admin tarafından gizle (isHidden=true). Şikâyetlerle ilgili
// değildir — admin kendi inisiyatifiyle yayından çekmek istediğinde kullanılır.
// reportCount korunur; admin "Geri Aç" derse mevcut açık şikâyetler "dismissed"
// işaretlenir (/api/admin/unhide pattern'i).
export async function POST(req: NextRequest) {
  const authErr = checkAdmin(req);
  if (authErr !== null)
    return NextResponse.json(
      { error: authErr === 429 ? 'Çok fazla istek.' : 'Yetkisiz.' },
      { status: authErr },
    );

  try {
    const body = await req.json();
    const photoId = String(body.photoId ?? '');
    if (!mongoose.Types.ObjectId.isValid(photoId))
      return NextResponse.json({ error: 'Geçersiz fotoğraf.' }, { status: 400 });

    await connectDB();

    const result = await Photo.findByIdAndUpdate(
      photoId,
      { $set: { isHidden: true } },
      { new: true },
    ).select('_id');
    if (!result)
      return NextResponse.json({ error: 'Fotoğraf bulunamadı.' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('admin hide error:', err);
    return NextResponse.json({ error: 'İşlem başarısız.' }, { status: 500 });
  }
}
