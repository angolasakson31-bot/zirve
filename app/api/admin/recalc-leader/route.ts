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

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });

  await connectDB();
  await Photo.updateMany({ isChampion: true }, { isChampion: false });

  const startOfDay = turkishStartOfDay();

  const candidates = await Photo.find({
    championDate: null,
    isArchived: false,
    voteCount: { $gte: LEADER_THRESHOLD },
    createdAt: { $gte: startOfDay },
  }).select('totalScore voteCount').lean();

  if (candidates.length === 0)
    return NextResponse.json({ ok: true, champion: null });

  // Global mean'i tüm bugünkü fotoğraflardan hesapla
  const allToday = await Photo.find({ isArchived: false, createdAt: { $gte: startOfDay } })
    .select('totalScore voteCount').lean();
  const totalVotes = allToday.reduce((s, p) => s + (p.voteCount ?? 0), 0);
  const totalScore = allToday.reduce((s, p) => s + (p.totalScore ?? 0), 0);
  const globalMean = totalVotes > 0 ? totalScore / totalVotes : DEFAULT_MEAN;

  const best = candidates.reduce((a, b) =>
    bayesianScore(a.totalScore, a.voteCount, globalMean) >=
    bayesianScore(b.totalScore, b.voteCount, globalMean) ? a : b
  );

  await Photo.findByIdAndUpdate(best._id, { isChampion: true });

  return NextResponse.json({ ok: true, champion: best._id });
}
