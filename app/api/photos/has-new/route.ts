import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import { rateLimit } from '@/lib/rate-limit';
import { turkishStartOfDay } from '@/lib/daily-reset';
import { hashIp } from '@/lib/hash-ip';

export const runtime = 'nodejs';

const checkLimit = rateLimit(120);

function parseIdList(param: string | null, max: number): mongoose.Types.ObjectId[] {
  if (!param) return [];
  return param
    .split(',')
    .slice(0, max)
    .filter(id => mongoose.Types.ObjectId.isValid(id))
    .map(id => new mongoose.Types.ObjectId(id));
}

export async function GET(req: NextRequest) {
  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '0.0.0.0';
  if (!checkLimit(rawIp))
    return NextResponse.json({ available: 0 }, { status: 429 });

  try {
    await connectDB();

    const ip = hashIp(rawIp);
    const excludeIds = parseIdList(req.nextUrl.searchParams.get('exclude'), 200);
    const myUploadIds = parseIdList(req.nextUrl.searchParams.get('myUploads'), 100);
    const allExclude = [...excludeIds, ...myUploadIds];

    // random/route.ts ile uyumlu — uploaderIp filtresi CGNAT sorunundan kaldırıldı,
    // yerine client'tan gelen myUploads listesi kullanılıyor.
    const match: Record<string, unknown> = {
      voters:     { $nin: [ip] },
      isArchived: false,
      createdAt:  { $gte: turkishStartOfDay() },
    };

    if (allExclude.length > 0) {
      match._id = { $nin: allExclude };
    }

    const available = await Photo.countDocuments(match);
    return NextResponse.json({ available });
  } catch {
    return NextResponse.json({ available: 0 });
  }
}
