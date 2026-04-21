import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';

export const runtime = 'nodejs';

function auth(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

function weightedScore(average: number, voteCount: number) {
  return average * Math.log(voteCount + 1);
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });

  await connectDB();

  // Tüm mevcut champion flag'lerini temizle
  await Photo.updateMany({ isChampion: true }, { isChampion: false });

  // Bugünün fotoğrafları arasından en yüksek ağırlıklı skoru bul
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const LEADER_THRESHOLD = 3;

  const candidates = await Photo.find({
    championDate: null,
    isArchived: false,
    voteCount: { $gte: LEADER_THRESHOLD },
    createdAt: { $gte: startOfDay },
  }).select('average voteCount');

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, champion: null });
  }

  const best = candidates.reduce((a, b) =>
    weightedScore(a.average, a.voteCount) >= weightedScore(b.average, b.voteCount) ? a : b
  );

  best.isChampion = true;
  await best.save();

  return NextResponse.json({ ok: true, champion: best._id });
}
