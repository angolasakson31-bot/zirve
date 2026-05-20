import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import { rateLimit } from '@/lib/rate-limit';
import { maybeRunDailyReset, turkishStartOfDay } from '@/lib/daily-reset';
import { hashIp } from '@/lib/hash-ip';

export const runtime = 'nodejs';

const checkLimit = rateLimit(30);

export async function GET(req: NextRequest) {
  const rawIp = req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || '0.0.0.0';
  if (!checkLimit(rawIp))
    return NextResponse.json({ available: 0 }, { status: 429 });

  try {
    await connectDB();
    await maybeRunDailyReset();

    const ip = hashIp(rawIp);
    const rawDt = req.nextUrl.searchParams.get('dt') ?? '';
    const dt = /^[0-9a-f]{32}$/.test(rawDt) ? rawDt : '';

    const excludeParam = req.nextUrl.searchParams.get('exclude') ?? '';
    const excludeObjectIds = excludeParam
      .split(',')
      .slice(0, 1000)
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    const match: Record<string, unknown> = {
      voters:     { $nin: [ip] },
      uploaderIp: { $ne: ip },
      isArchived: false,
      createdAt:  { $gte: turkishStartOfDay() },
    };

    if (dt) {
      match.deviceVoters   = { $nin: [dt] };
      match.uploaderDevice = { $ne: dt };
    }

    if (excludeObjectIds.length > 0) {
      match._id = { $nin: excludeObjectIds };
    }

    const available = await Photo.countDocuments(match);
    return NextResponse.json({ available });
  } catch {
    return NextResponse.json({ available: 0 });
  }
}
