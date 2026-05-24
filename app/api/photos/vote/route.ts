import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import BannedIP from '@/models/BannedIP';
import { rateLimit } from '@/lib/rate-limit';
import { hashIp } from '@/lib/hash-ip';
import { bayesianScore, DEFAULT_MEAN, BAYESIAN_C } from '@/lib/bayesian';
export const runtime = 'nodejs';

const checkLimit = rateLimit(30);
const LEADER_THRESHOLD = 3;
const MAX_VOTERS = 10_000;
const MAX_DEVICE_VOTERS = 10_000;

export async function POST(req: NextRequest) {
  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '0.0.0.0';
  const ip = hashIp(rawIp);
  if (!checkLimit(rawIp))
    return NextResponse.json({ error: 'Çok fazla istek. Lütfen bekleyin.' }, { status: 429 });

  try {
    const { photoId, score, dt: rawDt } = await req.json();
    if (!photoId || typeof score !== 'number' || !Number.isInteger(score) || score < 1 || score > 10)
      return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
    if (!mongoose.Types.ObjectId.isValid(photoId))
      return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });

    const dt = typeof rawDt === 'string' && /^[0-9a-f]{32}$/.test(rawDt) ? rawDt : '';

    await connectDB();

    const banned = await BannedIP.exists({ ip });
    if (banned) return NextResponse.json({ error: 'Erişiminiz kısıtlanmıştır.' }, { status: 403 });

    const incFields: Record<string, number> = { totalScore: score, voteCount: 1 };
    if (score >= 6) incFields.likeCount = 1;
    else incFields.dislikeCount = 1;

    const voteFilter: Record<string, unknown> = {
      _id: photoId,
      voters: { $ne: ip },
      uploaderIp: { $ne: ip },
      isArchived: false,
      $expr: {
        $and: [
          { $lt: [{ $size: '$voters' }, MAX_VOTERS] },
          { $lt: [{ $size: '$deviceVoters' }, MAX_DEVICE_VOTERS] },
        ],
      },
    };
    if (dt) {
      voteFilter.deviceVoters = { $ne: dt };
      voteFilter.uploaderDevice = { $ne: dt };
    }

    const pushFields: Record<string, unknown> = { voters: ip };
    if (dt) pushFields.deviceVoters = dt;

    const photo = await Photo.findOneAndUpdate(
      voteFilter,
      { $inc: incFields, $push: pushFields },
      { new: true }
    );

    if (!photo) {
      const existing = await Photo.findById(photoId).select('isArchived voters deviceVoters uploaderIp uploaderDevice');
      if (!existing) return NextResponse.json({ error: 'Fotoğraf bulunamadı.' }, { status: 404 });
      if (existing.isArchived) return NextResponse.json({ error: 'Arşivlenmiş fotoğrafa oy verilemez.' }, { status: 403 });
      if (existing.uploaderIp === ip || (dt && existing.uploaderDevice === dt))
        return NextResponse.json({ error: 'Kendi fotoğrafınıza oy veremezsiniz.' }, { status: 403 });
      if (existing.voters.includes(ip) || (dt && existing.deviceVoters?.includes(dt)))
        return NextResponse.json({ error: 'Zaten oyladınız.' }, { status: 409 });
      return NextResponse.json({ error: 'Oy verilemedi.' }, { status: 400 });
    }

    photo.average = photo.totalScore / photo.voteCount;
    await photo.save();

    let leaderChanged = false;
    if (photo.voteCount >= LEADER_THRESHOLD) {
      const myScore = bayesianScore(photo.totalScore, photo.voteCount, DEFAULT_MEAN);

      const dethroned = await Photo.findOneAndUpdate(
        {
          isChampion: true,
          _id: { $ne: photo._id },
          $expr: {
            $lt: [
              { $divide: [
                { $add: [{ $multiply: [BAYESIAN_C, DEFAULT_MEAN] }, '$totalScore'] },
                { $add: [BAYESIAN_C, '$voteCount'] },
              ]},
              myScore,
            ],
          },
        },
        { $set: { isChampion: false } }
      );

      const noChampion = !(await Photo.exists({ isChampion: true }));
      if (dethroned || noChampion) {
        await Photo.findByIdAndUpdate(photo._id, { $set: { isChampion: true } });
        photo.isChampion = true;
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
