import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongoose';
import { ViewerCode } from '@/models/ViewerCode';
import BannedIP from '@/models/BannedIP';
import { VIEWER_CODE_RE } from '@/lib/viewer-code';

export const runtime = 'nodejs';

// Sızan ekran görüntüsündeki filigran kodundan IP hash'ini bulur.
export async function GET(req: NextRequest) {
  const authErr = checkAdmin(req);
  if (authErr !== null) return NextResponse.json({ error: authErr === 429 ? 'Çok fazla istek.' : 'Yetkisiz.' }, { status: authErr });

  const code = (req.nextUrl.searchParams.get('code') ?? '').trim().toUpperCase();
  if (!VIEWER_CODE_RE.test(code))
    return NextResponse.json({ error: 'Kod 6 karakter olmalı.' }, { status: 400 });

  await connectDB();
  const doc = await ViewerCode.findOne({ code }).lean<{ ipHash: string; lastSeen: Date }>();
  if (!doc) return NextResponse.json({ error: 'Kod bulunamadı (90 günden eski olabilir).' }, { status: 404 });

  const banned = !!(await BannedIP.exists({ ip: doc.ipHash }));
  return NextResponse.json({ ipHash: doc.ipHash, lastSeen: doc.lastSeen, banned });
}
