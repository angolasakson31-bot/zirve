import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import { bayesianScore, DEFAULT_MEAN } from '@/lib/bayesian';
import { turkishStartOfDay } from '@/lib/daily-reset';

export const runtime = 'nodejs';

function auth(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

const LEADER_THRESHOLD = 3;

async function getGlobalMean(): Promise<number> {
  const photos = await Photo.find({ isArchived: false, createdAt: { $gte: turkishStartOfDay() } })
    .select('totalScore voteCount').lean();
  const totalVotes = photos.reduce((s, p) => s + (p.voteCount ?? 0), 0);
  const totalScore = photos.reduce((s, p) => s + (p.totalScore ?? 0), 0);
  return totalVotes > 0 ? totalScore / totalVotes : DEFAULT_MEAN;
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });

  try {
    const { photoId, score } = await req.json();
    if (!photoId || typeof score !== 'number' || score < 1 || score > 10)
      return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });

    await connectDB();

    const incFields: Record<string, number> = { totalScore: score, voteCount: 1 };
    if (score >= 6) incFields.likeCount = 1;
    else incFields.dislikeCount = 1;

    const photo = await Photo.findByIdAndUpdate(photoId, { $inc: incFields }, { new: true });
    if (!photo) return NextResponse.json({ error: 'Fotoğraf bulunamadı.' }, { status: 404 });

    photo.average = photo.totalScore / photo.voteCount;
    await photo.save();

    let leaderChanged = false;
    if (photo.voteCount >= LEADER_THRESHOLD && !photo.isArchived) {
      const globalMean = await getGlobalMean();
      const photoScore = bayesianScore(photo.totalScore, photo.voteCount, globalMean);
      const currentLeader = await Photo.findOne({ isChampion: true });

      if (currentLeader?._id.toString() !== photo._id.toString()) {
        const leaderScore = currentLeader
          ? bayesianScore(currentLeader.totalScore, currentLeader.voteCount, globalMean)
          : -1;
        if (photoScore > leaderScore) {
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
