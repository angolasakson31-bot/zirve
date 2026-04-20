import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const checkLimit = rateLimit(30);
const LEADER_THRESHOLD = 1;

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '0.0.0.0';
  if (!checkLimit(ip))
    return NextResponse.json({ error: 'Çok fazla istek. Lütfen bekleyin.' }, { status: 429 });

  try {
    const { photoId, score } = await req.json();

    if (!photoId || typeof score !== 'number' || score < 1 || score > 10)
      return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });

    await connectDB();

    const photo = await Photo.findById(photoId);
    if (!photo) return NextResponse.json({ error: 'Fotoğraf bulunamadı.' }, { status: 404 });
    if (photo.isChampion) return NextResponse.json({ error: 'Şampiyona oy verilemez.' }, { status: 403 });
    if (photo.voters.includes(ip)) return NextResponse.json({ error: 'Zaten oyladınız.' }, { status: 409 });

    photo.totalScore += score;
    photo.voteCount += 1;
    photo.average = photo.totalScore / photo.voteCount;
    photo.voters.push(ip);
    if (score >= 6) photo.likeCount += 1;
    else photo.dislikeCount += 1;
    await photo.save();

    let leaderChanged = false;
    if (photo.voteCount >= LEADER_THRESHOLD) {
      const currentLeader = await Photo.findOne({ isChampion: true });
      const isNewLeader = !currentLeader || photo.average > (currentLeader as any).average;
      if (isNewLeader && currentLeader?._id.toString() !== photo._id.toString()) {
        if (currentLeader) { currentLeader.isChampion = false; await currentLeader.save(); }
        photo.isChampion = true;
        await photo.save();
        leaderChanged = true;
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
