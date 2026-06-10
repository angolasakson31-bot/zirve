import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import { rateLimit } from '@/lib/rate-limit';
import { maybeRunDailyReset, turkishStartOfDay } from '@/lib/daily-reset';
import { hashIp } from '@/lib/hash-ip';
import { getClientIp } from '@/lib/get-ip';

export const runtime = 'nodejs';

const checkLimit = rateLimit(60);

export async function GET(req: NextRequest) {
  const rawIp = getClientIp(req);
  if (!checkLimit(rawIp))
    return NextResponse.json({ error: 'Çok fazla istek. Lütfen bekleyin.' }, { status: 429 });

  try {
    await connectDB();
    await maybeRunDailyReset();

    const ip = hashIp(rawIp);
    const startOfDay = turkishStartOfDay();

    const excludeParam = req.nextUrl.searchParams.get('exclude') ?? '';
    const excludeObjectIds = excludeParam
      .split(',')
      .slice(0, 500)
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    const rawDt = req.nextUrl.searchParams.get('dt') ?? '';
    const dt = /^[0-9a-f]{32}$/.test(rawDt) ? rawDt : '';

    const match: Record<string, unknown> = {
      voters: { $nin: [ip] },
      uploaderIp: { $ne: ip },
      isArchived: false,
      createdAt: { $gte: startOfDay },
    };

    if (dt) {
      match.deviceVoters  = { $nin: [dt] };
      match.uploaderDevice = { $ne: dt };
    }

    if (excludeObjectIds.length > 0) {
      match._id = { $nin: excludeObjectIds };
    }

    // $sample küçük koleksiyonlarda güvenilmez — countDocuments + skip kullan
    const count = await Photo.countDocuments(match);
    if (count === 0) return NextResponse.json({ photo: null });

    const skip = Math.floor(Math.random() * count);
    let photo = await Photo.findOne(match)
      .skip(skip)
      .select('_id url albumUrls average voteCount createdAt blurPlaceholder')
      .lean();

    // Eş zamanlı silme olursa skip aşabilir — ilk eşleşeni al
    if (!photo) {
      photo = await Photo.findOne(match)
        .select('_id url albumUrls average voteCount createdAt blurPlaceholder')
        .lean();
    }

    if (!photo) return NextResponse.json({ photo: null });
    const p = photo as unknown as Record<string, unknown>;
    return NextResponse.json({ photo: { ...p, albumUrls: (p.albumUrls as string[]) ?? [] } });
  } catch (err) {
    console.error('random route error:', err);
    return NextResponse.json({ error: 'Fotoğraf alınamadı.' }, { status: 500 });
  }
}
