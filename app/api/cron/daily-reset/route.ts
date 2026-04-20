import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });
  }

  try {
    await connectDB();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const leader = await Photo.findOne({ isChampion: true });
    if (leader) {
      leader.championDate = yesterdayStr;
      leader.isChampion = false;
      await leader.save();
    }

    return NextResponse.json({ ok: true, champion: leader?._id ?? null });
  } catch {
    return NextResponse.json({ error: 'Sıfırlama başarısız.' }, { status: 500 });
  }
}
