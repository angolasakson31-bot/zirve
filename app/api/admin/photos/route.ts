import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';

export const runtime = 'nodejs';

function auth(req: NextRequest) {
  const pwd = req.headers.get('x-admin-password');
  return pwd === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });
  await connectDB();
  const photos = await Photo.find({})
    .sort({ createdAt: -1 })
    .select('_id url albumUrls cloudinaryId uploaderIp average voteCount totalScore isChampion isArchived createdAt trackingCode contactInfo championDate comments')
    .lean();
  return NextResponse.json({ photos });
}
