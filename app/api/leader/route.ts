import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import { rateLimit } from '@/lib/rate-limit';
import { maybeRunDailyReset, turkishStartOfDay } from '@/lib/daily-reset';
import { bayesianScore, DEFAULT_MEAN } from '@/lib/bayesian';
import { getClientIp } from '@/lib/get-ip';
import { readLeaderCache, writeLeaderCache } from '@/lib/leader-cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const checkLimit = rateLimit(60);

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkLimit(ip))
    return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429 });

  // Cache geçerliyse hemen dön (vote ve admin endpoint'leri liderlik
  // değiştirince invalidateLeaderCache() ile sıfırlar — eski veri
  // gösterilmez).
  const cached = readLeaderCache();
  if (cached !== null) {
    return NextResponse.json(cached);
  }

  try {
    await connectDB();
    await maybeRunDailyReset();

    const startOfToday = turkishStartOfDay();

    const visibilityFilter = {
      isHidden: { $ne: true },
      // Pending ve rejected fotoğraflar liderlik tablosuna gelmesin.
      moderationStatus: { $nin: ['rejected', 'pending'] },
    };

    type LeaderDoc = {
      _id: unknown;
      url: string;
      albumUrls?: string[];
      average: number;
      voteCount: number;
      createdAt: Date;
      championDate?: string;
      blurPlaceholder?: string;
      comments?: { text: string; createdAt: Date; userHash?: string }[];
    };

    const stripComments = (p: LeaderDoc | null) => {
      if (!p) return null;
      const { comments, ...rest } = p;
      return {
        ...rest,
        comments: (comments ?? []).map(c => ({ text: c.text, createdAt: c.createdAt })),
      };
    };

    const [leaderRaw, yesterdayRaw] = await Promise.all([
      Photo.findOne({ isChampion: true, ...visibilityFilter })
        .select('url albumUrls average voteCount createdAt comments blurPlaceholder')
        .lean<LeaderDoc>(),
      Photo.findOne({ championDate: getYesterdayStr(), ...visibilityFilter })
        .select('url albumUrls average voteCount championDate comments blurPlaceholder')
        .lean<LeaderDoc>(),
    ]);

    const leader = stripComments(leaderRaw);
    const yesterday = stripComments(yesterdayRaw);

    const allToday = await Photo.find({
      isArchived: false,
      createdAt: { $gte: startOfToday },
      ...visibilityFilter,
    })
      .select('_id url average totalScore voteCount isChampion').lean();

    const allPhotos = allToday
      .map(p => ({ ...p, _score: bayesianScore(p.totalScore, p.voteCount, DEFAULT_MEAN) }))
      .sort((a, b) => {
        if (a.isChampion && !b.isChampion) return -1;
        if (!a.isChampion && b.isChampion) return 1;
        return b._score - a._score || b.voteCount - a.voteCount;
      })
      .map((p, i) => ({
        _id: p._id.toString(),
        url: p.url,
        average: parseFloat((p.voteCount > 0 ? p.totalScore / p.voteCount : 0).toFixed(1)),
        voteCount: p.voteCount,
        rank: i + 1,
      }));

    const payload = { leader, yesterday, allPhotos };
    writeLeaderCache(payload);
    return NextResponse.json(payload);
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
