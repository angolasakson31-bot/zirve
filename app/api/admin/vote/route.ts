import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import { turkishStartOfDay } from '@/lib/daily-reset';

export const runtime = 'nodejs';

const LEADER_THRESHOLD = 3;

export async function POST(req: NextRequest) {
  const authErr = checkAdmin(req);
  if (authErr !== null) return NextResponse.json({ error: authErr === 429 ? 'Çok fazla istek.' : 'Yetkisiz.' }, { status: authErr });

  try {
    const { photoId, score } = await req.json();
    if (!photoId || typeof score !== 'number' || !Number.isInteger(score) || score < 1 || score > 10)
      return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });

    await connectDB();

    const incFields: Record<string, number> = { totalScore: score, voteCount: 1 };
    if (score >= 6) incFields.likeCount = 1;
    else incFields.dislikeCount = 1;

    const photo = await Photo.findByIdAndUpdate(photoId, { $inc: incFields }, { new: true });
    if (!photo) return NextResponse.json({ error: 'Fotoğraf bulunamadı.' }, { status: 404 });

    photo.average = photo.totalScore / photo.voteCount;
    await photo.save();

    // Her admin oyundan sonra gerçek şampiyonu yeniden hesapla
    let leaderChanged = false;
    if (!photo.isArchived) {
      const topPhoto = await Photo.findOne({
        isArchived: false,
        voteCount: { $gte: LEADER_THRESHOLD },
        createdAt: { $gte: turkishStartOfDay() },
      }).sort({ average: -1, voteCount: -1 });

      if (topPhoto) {
        const topId = topPhoto._id.toString();
        // Yanlış şampiyonları temizle
        await Photo.updateMany(
          { isChampion: true, _id: { $ne: topPhoto._id } },
          { $set: { isChampion: false } }
        );
        // Doğru şampiyonu ata
        if (!topPhoto.isChampion) {
          await Photo.findByIdAndUpdate(topPhoto._id, { $set: { isChampion: true } });
          leaderChanged = true;
        }
        // Oyladığımız fotoğraf şampiyon olduysa local state'i güncelle
        if (topId === photo._id.toString()) {
          photo.isChampion = true;
        }
      }
    }

    return NextResponse.json({
      photo: { _id: photo._id, average: photo.average, voteCount: photo.voteCount },
      leaderChanged,
    });
  } catch {
    return NextResponse.json({ error: 'Oy verilemedi.' }, { status: 500 });
  }
}
