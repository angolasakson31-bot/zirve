import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import { hashIp } from '@/lib/hash-ip';
import { turkishStartOfDay } from '@/lib/daily-reset';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '0.0.0.0';
  const ip = hashIp(rawIp);

  await connectDB();
  const exists = await Photo.exists({
    uploaderIp: ip,
    isArchived: false,
    createdAt: { $gte: turkishStartOfDay() },
  });

  return NextResponse.json({ valid: !!exists });
}
