import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import Report, { ReportReason } from '@/models/Report';
import { rateLimit } from '@/lib/rate-limit';
import { hashIp } from '@/lib/hash-ip';
import { getClientIp } from '@/lib/get-ip';
import { getReportAutoHideThreshold } from '@/lib/report-threshold';

export const runtime = 'nodejs';

const checkLimit = rateLimit(5);

const VALID_REASONS: ReportReason[] = [
  'ncii', 'minor', 'insult', 'copyright', 'personal_data', 'other',
];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rawIp = getClientIp(req);
  if (!checkLimit(rawIp))
    return NextResponse.json({ error: 'Çok fazla şikâyet. Lütfen bekleyin.' }, { status: 429 });

  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ error: 'Geçersiz fotoğraf.' }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const reason = String(body.reason ?? '') as ReportReason;
    const rawDetails = typeof body.details === 'string' ? body.details : '';
    const rawDevice = typeof body.dt === 'string' ? body.dt : '';

    if (!VALID_REASONS.includes(reason))
      return NextResponse.json({ error: 'Geçersiz sebep.' }, { status: 400 });

    const details = rawDetails.replace(/<[^>]*>/g, '').trim().slice(0, 500);
    const reporterDevice = /^[0-9a-f]{32}$/.test(rawDevice) ? rawDevice : '';

    await connectDB();

    const photo = await Photo.exists({ _id: id });
    if (!photo)
      return NextResponse.json({ error: 'Fotoğraf bulunamadı.' }, { status: 404 });

    const reporterIpHash = hashIp(rawIp);

    // Aynı IP'den aynı fotoğrafa tekrar şikâyet engellenir (unique index).
    try {
      await Report.create({
        photoId: id,
        reason,
        details,
        reporterIpHash,
        reporterDevice,
      });
    } catch (err) {
      const e = err as { code?: number };
      if (e?.code === 11000) {
        return NextResponse.json({ ok: true, alreadyReported: true });
      }
      throw err;
    }

    const [reportCount, threshold] = await Promise.all([
      Report.countDocuments({ photoId: id, status: 'open' }),
      getReportAutoHideThreshold(),
    ]);

    const update: Record<string, unknown> = { reportCount };
    if (reportCount >= threshold) {
      update.isHidden = true;
    }
    await Photo.updateOne({ _id: id }, { $set: update });

    return NextResponse.json({
      ok: true,
      reportCount,
      autoHidden: reportCount >= threshold,
    });
  } catch (err) {
    console.error('report route error:', err);
    return NextResponse.json({ error: 'Şikâyet alınamadı.' }, { status: 500 });
  }
}
