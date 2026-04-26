import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import { rateLimit } from '@/lib/rate-limit';
export const runtime = 'nodejs';

const checkLimit = rateLimit(30);
const LEADER_THRESHOLD = 3;

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '0.0.0.0';
  if (!checkLimit(ip))
    return NextResponse.json({ error: 'Çok fazla istek. Lütfen bekleyin.' }, { status: 429 });

  try {
    const { photoId, score } = await req.json();
    if (!photoId || typeof score !== 'number' || score < 1 || score > 10)
      return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });

    await connectDB();

    const incFields: Record<string, number> = { totalScore: score, voteCount: 1 };
    if (score >= 6) incFields.likeCount = 1;
    else incFields.dislikeCount = 1;

    const photo = await Photo.findOneAndUpdate(
      { _id: photoId, voters: { $ne: ip }, isArchived: false },
      { $inc: incFields, $push: { voters: ip } },
      { new: true }
    );

    if (!photo) {
      const existing = await Photo.findById(photoId);
      if (!existing) return NextResponse.json({ error: 'Fotoğraf bulunamadı.' }, { status: 404 });
      if (existing.isArchived) return NextResponse.json({ error: 'Arşivlenmiş fotoğrafa oy verilemez.' }, { status: 403 });
      if (existing.voters.includes(ip)) return NextResponse.json({ error: 'Zaten oyladınız.' }, { status: 409 });
      return NextResponse.json({ error: 'Oy verilemedi.' }, { status: 400 });
    }

    photo.average = photo.totalScore / photo.voteCount;
    await photo.save();

    let leaderChanged = false;
    if (photo.voteCount >= LEADER_THRESHOLD) {
      const currentLeader = await Photo.findOne({ isChampion: true });

      if (currentLeader?._id.toString() !== photo._id.toString()) {
        const leaderAvg = currentLeader
          ? currentLeader.totalScore / currentLeader.voteCount
          : -1;
        if (photo.average > leaderAvg) {
          if (currentLeader) { currentLeader.isChampion = false; await currentLeader.save(); }
          photo.isChampion = true;
          await photo.save();
          leaderChanged = true;
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
