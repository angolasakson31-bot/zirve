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

    const leader = await Photo.findOne({ isChampion: true })
      .select('url albumUrls average voteCount createdAt contactInfo comments');
    const yesterday = await Photo.findOne({ championDate: getYesterdayStr() })
      .select('url albumUrls average voteCount championDate contactInfo comments');

    const startOfToday = turkishStartOfDay();

    const allToday = await Photo.find({ isArchived: false, createdAt: { $gte: startOfToday } })
      .select('_id url average totalScore voteCount isChampion').lean();

    const allPhotos = allToday
      .map(p => ({ ...p, _avg: p.voteCount > 0 ? p.totalScore / p.voteCount : 0 }))
      .sort((a, b) => b._avg - a._avg || b.voteCount - a.voteCount)
      .map((p, i) => ({
        _id: p._id.toString(),
        url: p.url,
        average: parseFloat(p._avg.toFixed(1)),
        voteCount: p.voteCount,
        rank: i + 1,
      }));

    return NextResponse.json({ leader, yesterday, allPhotos });
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
