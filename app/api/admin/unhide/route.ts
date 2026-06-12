import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { checkAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import Report from '@/models/Report';
import { invalidateLeaderCache } from '@/lib/leader-cache';

export const runtime = 'nodejs';

// POST → bir fotoğrafı isHidden=false yap + ilgili açık şikâyetleri "dismiss"
// işaretle + reportCount sıfırla. Yanlışlıkla şikâyetle gizlenmiş fotoğrafları
// admin paneli üzerinden tek tıkla geri açmak için.
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

    // Pending fotoğraf "Geri Aç" ile yayına alınamaz — Onayla butonu kullanılmalı.
    // (Aksi takdirde durum tutarsızlığı: status=pending + isHidden=false.)
    const existing = await Photo.findById(photoId).select('moderationStatus');
    if (!existing)
      return NextResponse.json({ error: 'Fotoğraf bulunamadı.' }, { status: 404 });
    if (existing.moderationStatus === 'pending')
      return NextResponse.json(
        { error: 'Onay bekleyen fotoğraf için "Onayla" butonunu kullanın.' },
        { status: 400 },
      );

    await Photo.updateOne(
      { _id: photoId },
      { $set: { isHidden: false, reportCount: 0 } },
    );

    await Report.updateMany(
      { photoId, status: 'open' },
      { $set: { status: 'dismissed' } },
    );

    invalidateLeaderCache();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('admin unhide error:', err);
    return NextResponse.json({ error: 'İşlem başarısız.' }, { status: 500 });
  }
}
