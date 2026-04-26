import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import { rateLimit } from '@/lib/rate-limit';
import { maybeRunDailyReset, turkishStartOfDay } from '@/lib/daily-reset';
import { bayesianScore, DEFAULT_MEAN } from '@/lib/bayesian';

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
      .select('url albumUrls average voteCount createdAt contactInfo');
    const yesterday = await Photo.findOne({ championDate: getYesterdayStr() })
      .select('url albumUrls average voteCount championDate contactInfo');

    const startOfToday = turkishStartOfDay();

    // Tüm bugünkü fotoğraflardan global mean hesapla
    const allToday = await Photo.find({ isArchived: false, createdAt: { $gte: startOfToday } })
      .select('_id url albumUrls average totalScore voteCount isChampion').lean();

    const totalVotes = allToday.reduce((s, p) => s + (p.voteCount ?? 0), 0);
    const totalScore = allToday.reduce((s, p) => s + (p.totalScore ?? 0), 0);
    const globalMean = totalVotes > 0 ? totalScore / totalVotes : DEFAULT_MEAN;

    // Leader hariç Bayesian'a göre sırala, ilk 4'ü al
    const runnerUps = allToday
      .filter(p => !p.isChampion)
      .map(p => ({ ...p, _bscore: bayesianScore(p.totalScore ?? 0, p.voteCount ?? 0, globalMean) }))
      .sort((a, b) => b._bscore - a._bscore)
      .slice(0, 4)
      .map(({ _bscore, totalScore: _ts, isChampion: _ic, ...rest }) => rest);

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
