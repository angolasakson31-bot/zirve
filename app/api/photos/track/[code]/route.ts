import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import DeletedPhoto from '@/models/DeletedPhoto';
import BannedIP from '@/models/BannedIP';
import { rateLimit } from '@/lib/rate-limit';
import { toTurkishDateStr } from '@/lib/daily-reset';

export const runtime = 'nodejs';

const checkLimit = rateLimit(20);

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '0.0.0.0';
  if (!checkLimit(ip))
    return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429 });

  try {
    const { code } = await params;
    if (!/^ZRV-[A-Z2-9]{5}$/.test(code.toUpperCase()))
      return NextResponse.json({ error: 'Geçersiz kod.' }, { status: 400 });

    await connectDB();

    const photo = await Photo.findOne({ trackingCode: code.toUpperCase() })
      .select('url voteCount average likeCount dislikeCount isChampion createdAt isArchived comments uploaderIp')
      .lean<{
        _id: unknown; url: string; voteCount: number; average: number;
        likeCount: number; dislikeCount: number; isChampion: boolean;
        createdAt: Date; isArchived: boolean; uploaderIp: string;
        comments: { text: string; createdAt: Date }[];
      }>();

    if (!photo) {
      // Check tombstone
      const deleted = await DeletedPhoto.findOne({ trackingCode: code.toUpperCase() }).lean();
      if (deleted) {
        return NextResponse.json({ deleted: true, reason: (deleted as any).reason });
      }
      return NextResponse.json({ error: 'Kod bulunamadı.' }, { status: 404 });
    }

    const TZ = 3 * 60 * 60 * 1000;
    const trDate = toTurkishDateStr(photo.createdAt);
    const [y, m, d] = trDate.split('-').map(Number);
    const startOfDay = new Date(Date.UTC(y, m - 1, d) - TZ);
    const endOfDay   = new Date(Date.UTC(y, m - 1, d + 1) - TZ);

    const [totalToday, betterCount, ban] = await Promise.all([
      Photo.countDocuments({ createdAt: { $gte: startOfDay, $lt: endOfDay } }),
      Photo.countDocuments({
        createdAt: { $gte: startOfDay, $lt: endOfDay },
        average: { $gt: photo.average },
      }),
      BannedIP.findOne({ ip: photo.uploaderIp }).lean(),
    ]);

    const rank = betterCount + 1;

    // userHash sızdırılmıyor
    const safeComments = (photo.comments ?? []).map((c) => ({
      text: c.text,
      createdAt: c.createdAt,
    }));

    // Don't leak uploaderIp in the response
    const { uploaderIp: _uploaderIp, ...safePhoto } = photo;

    return NextResponse.json({
      photo: { ...safePhoto, comments: safeComments },
      rank,
      totalToday,
      ...(ban ? { isBanned: true, banReason: (ban as any).reason } : {}),
    });
  } catch {
    return NextResponse.json({ error: 'Hata oluştu.' }, { status: 500 });
  }
}
