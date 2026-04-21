import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import { toTurkishDateStr } from '@/lib/daily-reset';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });
  }

  try {
    await connectDB();

    const leader = await Photo.findOne({ isChampion: true });
    if (leader) {
      leader.championDate = toTurkishDateStr(leader.createdAt as Date);
      leader.isChampion = false;
      await leader.save();
    }

    // Archive all non-archived photos (today's active photos)
    await Photo.updateMany(
      { isArchived: false },
      { $set: { isArchived: true } }
    );

    return NextResponse.json({ ok: true, champion: leader?._id ?? null });
  } catch {
    return NextResponse.json({ error: 'Sıfırlama başarısız.' }, { status: 500 });
  }
}
