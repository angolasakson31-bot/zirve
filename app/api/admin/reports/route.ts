import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { checkAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongoose';
import Report from '@/models/Report';
import Photo from '@/models/Photo';
import { invalidateLeaderCache } from '@/lib/leader-cache';

export const runtime = 'nodejs';

// GET → bekleyen şikâyetleri listele
export async function GET(req: NextRequest) {
  const authErr = checkAdmin(req);
  if (authErr !== null)
    return NextResponse.json({ error: authErr === 429 ? 'Çok fazla istek.' : 'Yetkisiz.' }, { status: authErr });

  try {
    await connectDB();

    const reports = await Report.find({ status: 'open' })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    // İlgili fotoğrafların URL'lerini çek
    const photoIds = [...new Set(reports.map(r => String(r.photoId)))];
    const photos = await Photo.find({ _id: { $in: photoIds } })
      .select('_id url trackingCode reportCount isHidden moderationStatus')
      .lean();

    const photoMap = new Map(photos.map(p => [String(p._id), p]));

    const items = reports.map(r => ({
      _id: String(r._id),
      photoId: String(r.photoId),
      reason: r.reason,
      details: r.details,
      createdAt: r.createdAt,
      photo: photoMap.get(String(r.photoId)) ?? null,
    }));

    return NextResponse.json({ reports: items });
  } catch (err) {
    console.error('admin reports GET error:', err);
    return NextResponse.json({ error: 'Şikâyetler alınamadı.' }, { status: 500 });
  }
}

// POST → bir şikâyet veya fotoğrafa karar uygula (resolve / dismiss / hide / unhide)
export async function POST(req: NextRequest) {
  const authErr = checkAdmin(req);
  if (authErr !== null)
    return NextResponse.json({ error: authErr === 429 ? 'Çok fazla istek.' : 'Yetkisiz.' }, { status: authErr });

  try {
    const body = await req.json();
    const action = String(body.action ?? '');
    const photoId = String(body.photoId ?? '');

    if (!mongoose.Types.ObjectId.isValid(photoId))
      return NextResponse.json({ error: 'Geçersiz fotoğraf.' }, { status: 400 });

    await connectDB();

    // Pending fotoğraflar için unhide/dismiss yasak — durum tutarsızlığını
    // (status='pending' + isHidden=false) önler. Admin pending fotoğrafı
    // /api/admin/moderate (Onayla) ile yayına almalı.
    const needsPendingGuard = action === 'unhide' || action === 'dismiss';
    if (needsPendingGuard) {
      const photo = await Photo.findById(photoId).select('moderationStatus');
      if (photo?.moderationStatus === 'pending') {
        return NextResponse.json(
          { error: 'Onay bekleyen fotoğraf için "Onayla" butonunu kullanın.' },
          { status: 400 },
        );
      }
    }

    if (action === 'hide') {
      await Photo.updateOne({ _id: photoId }, { $set: { isHidden: true } });
    } else if (action === 'unhide') {
      await Photo.updateOne({ _id: photoId }, { $set: { isHidden: false, reportCount: 0 } });
      await Report.updateMany({ photoId, status: 'open' }, { $set: { status: 'dismissed' } });
    } else if (action === 'resolve') {
      // Şikâyetleri çözüldü işaretle (fotoğraf zaten silinmiş olabilir)
      await Report.updateMany({ photoId, status: 'open' }, { $set: { status: 'resolved' } });
    } else if (action === 'dismiss') {
      // Şikâyetler geçersiz, fotoğraf yayında kalsın
      await Report.updateMany({ photoId, status: 'open' }, { $set: { status: 'dismissed' } });
      await Photo.updateOne({ _id: photoId }, { $set: { isHidden: false, reportCount: 0 } });
    } else {
      return NextResponse.json({ error: 'Geçersiz işlem.' }, { status: 400 });
    }

    invalidateLeaderCache();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('admin reports POST error:', err);
    return NextResponse.json({ error: 'İşlem başarısız.' }, { status: 500 });
  }
}
