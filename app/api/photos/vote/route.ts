import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import BannedIP from '@/models/BannedIP';
import { rateLimit } from '@/lib/rate-limit';
import { hashIp } from '@/lib/hash-ip';
import { getClientIp } from '@/lib/get-ip';
import { bayesianScore, DEFAULT_MEAN, BAYESIAN_C } from '@/lib/bayesian';
export const runtime = 'nodejs';

const checkLimit = rateLimit(30);
const LEADER_THRESHOLD = 3;
const MAX_VOTERS = 10_000;
const MAX_DEVICE_VOTERS = 10_000;

export async function POST(req: NextRequest) {
  const rawIp = getClientIp(req);
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

    const voteFilter: Record<string, unknown> = {
      _id: photoId,
      voters: { $ne: ip },
      uploaderIp: { $ne: ip },
      isArchived: false,
      isHidden: { $ne: true },
      // Pending ve rejected fotoğraflara oy verilemez (random/has-new ile tutarlı).
      moderationStatus: { $nin: ['rejected', 'pending'] },
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

    // Tek atomik aggregation pipeline: skor inc + voters push + average hesabı
    // hepsi tek MongoDB işleminde. Önceki "findOneAndUpdate + save" pattern'i
    // eşzamanlı oylarda average alanını bozuyordu.
    const updatePipeline: Record<string, unknown>[] = [
      {
        $set: {
          totalScore: { $add: ['$totalScore', score] },
          voteCount:  { $add: ['$voteCount', 1] },
          likeCount:  {
            $cond: [{ $gte: [score, 6] }, { $add: ['$likeCount', 1] }, '$likeCount'],
          },
          dislikeCount: {
            $cond: [{ $lt: [score, 6] }, { $add: ['$dislikeCount', 1] }, '$dislikeCount'],
          },
          voters: { $concatArrays: ['$voters', [ip]] },
          ...(dt ? { deviceVoters: { $concatArrays: ['$deviceVoters', [dt]] } } : {}),
        },
      },
      {
        $set: {
          average: {
            $cond: [
              { $gt: ['$voteCount', 0] },
              { $divide: ['$totalScore', '$voteCount'] },
              0,
            ],
          },
        },
      },
    ];

    const photo = await Photo.findOneAndUpdate(
      voteFilter,
      updatePipeline,
      { new: true }
    );

    if (!photo) {
      const existing = await Photo.findById(photoId).select('isArchived isHidden moderationStatus voters deviceVoters uploaderIp uploaderDevice');
      if (!existing) return NextResponse.json({ error: 'Oy verilemedi.' }, { status: 404 });
      // Tüm "neden başarısız" durumlarını tek mesajda birleştir — kimlik
      // fingerprint sızıntısını önler (saldırgan uploader/voter olup olmadığını
      // hata mesajından öğrenemez).
      if (existing.isArchived || existing.isHidden || existing.moderationStatus === 'rejected')
        return NextResponse.json({ error: 'Bu fotoğraf şu an oylanamıyor.' }, { status: 403 });
      return NextResponse.json({ error: 'Oy verilemedi.' }, { status: 403 });
    }

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
        try {
          await Photo.findByIdAndUpdate(photo._id, { $set: { isChampion: true } });
          photo.isChampion = true;
          leaderChanged = true;
        } catch (err) {
          // Unique partial index sayesinde başkası zaten şampiyon olduysa
          // 11000 (duplicate key) gelir — sessizce kabul et, mevcut şampiyon kalır.
          const e = err as { code?: number };
          if (e?.code !== 11000) throw err;
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
