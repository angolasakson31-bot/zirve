import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const checkLimit = rateLimit(60);

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '0.0.0.0';
  if (!checkLimit(ip))
    return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429 });

  try {
    await connectDB();

    const leader = await Photo.findOne({ isChampion: true }).select('url average voteCount createdAt contactInfo');
    const yesterday = await Photo.findOne({ championDate: getYesterdayStr() }).select('url average voteCount championDate');

    return NextResponse.json({ leader, yesterday });
  } catch {
    return NextResponse.json({ error: 'Lider alınamadı.' }, { status: 500 });
  }
}

function getYesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}
