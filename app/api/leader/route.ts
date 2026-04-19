import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();

    const leader = await Photo.findOne({ isChampion: true }).select('url average voteCount createdAt');
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
