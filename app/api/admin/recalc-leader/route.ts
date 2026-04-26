import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
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

  const best = candidates.reduce((a, b) =>
    (a.totalScore / a.voteCount) >= (b.totalScore / b.voteCount) ? a : b
  );

  await Photo.findByIdAndUpdate(best._id, { isChampion: true });

  return NextResponse.json({ ok: true, champion: best._id });
}
