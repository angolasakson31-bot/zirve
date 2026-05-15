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

  const best = candidates.reduce((a, b) =>
    (a.totalScore / a.voteCount) >= (b.totalScore / b.voteCount) ? a : b
  );

  await Photo.findByIdAndUpdate(best._id, { isChampion: true });

  return NextResponse.json({ ok: true, champion: best._id });
}
