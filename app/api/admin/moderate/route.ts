import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { checkAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import DeletedPhoto from '@/models/DeletedPhoto';
import Report from '@/models/Report';
import cloudinary from '@/lib/cloudinary';

export const runtime = 'nodejs';

async function destroyCloudinaryAsset(publicId: string): Promise<void> {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch {
    // Sessizce yoksay
  }
}

// POST → bekleyen fotoğrafı onayla veya reddet
// body: { photoId, action: 'approve' | 'reject', reason?: string }
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
    const action = String(body.action ?? '');
    const reason = typeof body.reason === 'string' ? body.reason.slice(0, 200) : '';

    if (!mongoose.Types.ObjectId.isValid(photoId))
      return NextResponse.json({ error: 'Geçersiz fotoğraf.' }, { status: 400 });
    if (action !== 'approve' && action !== 'reject')
      return NextResponse.json({ error: 'Geçersiz işlem.' }, { status: 400 });

    await connectDB();

    if (action === 'approve') {
      // Yayına çıkar — pending/hidden durumunu kaldır + reportCount sıfırla
      // (bekleyenken birikmiş olabilir) ve açık şikâyetleri dismiss et.
      const result = await Photo.findByIdAndUpdate(
        photoId,
        { $set: { moderationStatus: 'approved', isHidden: false, reportCount: 0 } },
        { new: true },
      ).select('_id');
      if (!result)
        return NextResponse.json({ error: 'Fotoğraf bulunamadı.' }, { status: 404 });
      await Report.updateMany(
        { photoId, status: 'open' },
        { $set: { status: 'dismissed' } },
      );
      return NextResponse.json({ ok: true, action: 'approve' });
    }

    // reject: tombstone bırak, açık şikâyetleri çözüldü işaretle,
    // Cloudinary'den ve DB'den sil
    const photo = await Photo.findById(photoId);
    if (!photo)
      return NextResponse.json({ error: 'Fotoğraf bulunamadı.' }, { status: 404 });

    await DeletedPhoto.create({
      trackingCode: photo.trackingCode,
      reason: reason || 'Onay reddedildi',
    });

    await Report.updateMany(
      { photoId, status: 'open' },
      { $set: { status: 'resolved' } },
    );

    await destroyCloudinaryAsset(photo.cloudinaryId);
    await Photo.deleteOne({ _id: photoId });

    return NextResponse.json({ ok: true, action: 'reject' });
  } catch (err) {
    console.error('admin moderate error:', err);
    return NextResponse.json({ error: 'İşlem başarısız.' }, { status: 500 });
  }
}
