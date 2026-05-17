import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import { rateLimit } from '@/lib/rate-limit';
import { maybeRunDailyReset, turkishStartOfDay } from '@/lib/daily-reset';
import { hashIp } from '@/lib/hash-ip';

export const runtime = 'nodejs';

const checkLimit = rateLimit(60);

// Adil dağılım için: en az puanlanmış N fotoğraf arasından rastgele seç.
// Bu sayede her fotoğraf eninde sonunda görüntülenir, $sample race
// condition'ı yaşanmaz, ve az oylanmış fotoğraflar öncelik kazanır.
const CANDIDATE_POOL_SIZE = 12;

function parseIdList(param: string | null, max: number): mongoose.Types.ObjectId[] {
  if (!param) return [];
  return param
    .split(',')
    .slice(0, max)
    .filter(id => mongoose.Types.ObjectId.isValid(id))
    .map(id => new mongoose.Types.ObjectId(id));
}

export async function GET(req: NextRequest) {
  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '0.0.0.0';
  if (!checkLimit(rawIp))
    return NextResponse.json({ error: 'Çok fazla istek. Lütfen bekleyin.' }, { status: 429 });

  try {
    await connectDB();
    await maybeRunDailyReset();

    const ip = hashIp(rawIp);
    const startOfDay = turkishStartOfDay();

    const excludeIds = parseIdList(req.nextUrl.searchParams.get('exclude'), 200);
    // myUploads: bu tarayıcının kendi yüklediği fotoğraflar (localStorage'dan).
    // IP-bazlı uploaderIp filtresinin yerine bu kullanılıyor — CGNAT / paylaşımlı
    // IP sorununu çözüyor: aynı operatör IP'sindeki diğer kullanıcılar artık
    // birbirlerinin fotoğraflarını görebiliyor.
    const myUploadIds = parseIdList(req.nextUrl.searchParams.get('myUploads'), 100);

    const allExclude = [...excludeIds, ...myUploadIds];

    const match: Record<string, unknown> = {
      voters: { $nin: [ip] },
      isArchived: false,
      createdAt: { $gte: startOfDay },
    };

    if (allExclude.length > 0) {
      match._id = { $nin: allExclude };
    }

    // En az puanlanmış N fotoğrafı al, aralarından rastgele seç.
    // Bu deterministik sorgu $sample'ın güvenilmezliğini ortadan kaldırır
    // ve her fotoğrafın oylanmasını garantiler.
    const candidates = await Photo.find(match)
      .sort({ voteCount: 1, createdAt: 1 })
      .limit(CANDIDATE_POOL_SIZE)
      .select({ _id: 1, url: 1, albumUrls: 1, average: 1, voteCount: 1, createdAt: 1 })
      .lean();

    if (candidates.length === 0) {
      return NextResponse.json({ photo: null });
    }

    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    return NextResponse.json({
      photo: { ...picked, albumUrls: picked.albumUrls ?? [] },
    });
  } catch (err) {
    console.error('random route error:', err);
    return NextResponse.json({ error: 'Fotoğraf alınamadı.' }, { status: 500 });
  }
}
