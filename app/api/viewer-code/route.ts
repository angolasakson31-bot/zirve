import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { ViewerCode } from '@/models/ViewerCode';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-ip';
import { hashIp } from '@/lib/hash-ip';
import { viewerCodeFromIpHash } from '@/lib/viewer-code';

export const runtime = 'nodejs';

const limit = rateLimit(20);

// Fotoğraf filigranına basılan kişiye özel kod.
export async function GET(req: NextRequest) {
  const rawIp = getClientIp(req);
  if (!limit(rawIp)) return NextResponse.json({ code: null }, { status: 429 });

  try {
    const ipHash = hashIp(rawIp);
    const code = viewerCodeFromIpHash(ipHash);
    await connectDB();
    await ViewerCode.findOneAndUpdate(
      { code },
      { $set: { ipHash, lastSeen: new Date() } },
      { upsert: true },
    );
    return NextResponse.json({ code });
  } catch {
    return NextResponse.json({ code: null }, { status: 500 });
  }
}
