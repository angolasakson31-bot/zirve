import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import cloudinary from '@/lib/cloudinary';
import Photo from '@/models/Photo';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });
  }

  try {
    await connectDB();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Günün şampiyonunu kaydet
    const leader = await Photo.findOne({ isChampion: true });
    if (leader) {
      leader.championDate = yesterdayStr;
      leader.isChampion = false;
      await leader.save();
    }

    // Şampiyon olmayan tüm fotoğrafları sil (Cloudinary + DB)
    const toDelete = await Photo.find({ championDate: null, isChampion: false });

    await Promise.all(
      toDelete.map(p => cloudinary.uploader.destroy(p.cloudinaryId).catch(() => null))
    );

    const deletedCount = toDelete.length;
    if (deletedCount > 0) {
      await Photo.deleteMany({ _id: { $in: toDelete.map(p => p._id) } });
    }

    return NextResponse.json({ ok: true, champion: leader?._id ?? null, deleted: deletedCount });
  } catch {
    return NextResponse.json({ error: 'Sıfırlama başarısız.' }, { status: 500 });
  }
}
