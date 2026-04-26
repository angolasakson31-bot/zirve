import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import { rateLimit } from '@/lib/rate-limit';
import { turkishStartOfDay } from '@/lib/daily-reset';

export const runtime = 'nodejs';

const checkLimit = rateLimit(120);

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '0.0.0.0';
  if (!checkLimit(ip))
    return NextResponse.json({ available: 0 }, { status: 429 });

  try {
    await connectDB();

    const excludeParam = req.nextUrl.searchParams.get('exclude') ?? '';
    const excludeObjectIds = excludeParam
      .split(',')
      .slice(0, 500)
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    const match: Record<string, unknown> = {
      voters:     { $nin: [ip] },
      uploaderIp: { $ne: ip },
      isArchived: false,
      createdAt:  { $gte: turkishStartOfDay() },
    };

    if (excludeObjectIds.length > 0) {
      match._id = { $nin: excludeObjectIds };
    }

    const available = await Photo.countDocuments(match);
    return NextResponse.json({ available });
  } catch {
    return NextResponse.json({ available: 0 });
  }
}
