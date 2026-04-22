import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import { rateLimit } from '@/lib/rate-limit';
import { maybeRunDailyReset, turkishStartOfDay } from '@/lib/daily-reset';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const checkLimit = rateLimit(60);

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '0.0.0.0';
  if (!checkLimit(ip))
    return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429 });

  try {
    await connectDB();
    await maybeRunDailyReset();

    const leader = await Photo.findOne({ isChampion: true }).select('url albumUrls average voteCount createdAt contactInfo');
    const yesterday = await Photo.findOne({ championDate: getYesterdayStr() }).select('url albumUrls average voteCount championDate contactInfo');

    const startOfToday = turkishStartOfDay();
    const runnerUps = await Photo.aggregate([
      {
        $match: {
          isArchived: false,
          createdAt: { $gte: startOfToday },
          ...(leader ? { _id: { $ne: leader._id } } : {}),
        },
      },
      { $addFields: { score: { $multiply: ['$average', { $ln: { $add: ['$voteCount', 1] } }] } } },
      { $sort: { score: -1 } },
      { $limit: 4 },
      { $project: { url: 1, albumUrls: 1, average: 1, voteCount: 1 } },
    ]);

    return NextResponse.json({ leader, yesterday, runnerUps });
  } catch {
    return NextResponse.json({ error: 'Lider alınamadı.' }, { status: 500 });
  }
}

function getYesterdayStr() {
  const TZ_OFFSET_MS = 3 * 60 * 60 * 1000;
  const todayTr = new Date(Date.now() + TZ_OFFSET_MS).toISOString().split('T')[0];
  const [y, m, d] = todayTr.split('-').map(Number);
  const yesterday = new Date(Date.UTC(y, m - 1, d - 1));
  return yesterday.toISOString().split('T')[0];
}
