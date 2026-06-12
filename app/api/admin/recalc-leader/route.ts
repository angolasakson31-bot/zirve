import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import { turkishStartOfDay } from '@/lib/daily-reset';
import { bayesianScore, DEFAULT_MEAN } from '@/lib/bayesian';

export const runtime = 'nodejs';

const LEADER_THRESHOLD = 3;

export async function POST(req: NextRequest) {
  const authErr = checkAdmin(req);
  if (authErr !== null) return NextResponse.json({ error: authErr === 429 ? 'Çok fazla istek.' : 'Yetkisiz.' }, { status: authErr });

  await connectDB();
  await Photo.updateMany({ isChampion: true }, { isChampion: false });

  const startOfDay = turkishStartOfDay();

  const candidates = await Photo.find({
    championDate: null,
    isArchived: false,
    isHidden: { $ne: true },
    moderationStatus: { $ne: 'rejected' },
    voteCount: { $gte: LEADER_THRESHOLD },
    createdAt: { $gte: startOfDay },
  }).select('totalScore voteCount').lean();

  if (candidates.length === 0)
    return NextResponse.json({ ok: true, champion: null });

  // Bayes skoru kullan — public leaderboard sıralamasıyla tutarlı kalsın.
  const best = candidates.reduce((a, b) => {
    const sa = bayesianScore(a.totalScore, a.voteCount, DEFAULT_MEAN);
    const sb = bayesianScore(b.totalScore, b.voteCount, DEFAULT_MEAN);
    return sa >= sb ? a : b;
  });

  try {
    await Photo.findByIdAndUpdate(best._id, { isChampion: true });
  } catch (err) {
    const e = err as { code?: number };
    if (e?.code !== 11000) throw err;
    // Çok nadir: updateMany ile findByIdAndUpdate arasına paralel bir vote
    // girip şampiyon koltuğuna oturduysa, mevcut şampiyonu temizleyip tekrar dene.
    await Photo.updateMany({ isChampion: true }, { $set: { isChampion: false } });
    await Photo.findByIdAndUpdate(best._id, { isChampion: true });
  }

  return NextResponse.json({ ok: true, champion: best._id });
}
