import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { DailyVisitor } from '@/models/DailyVisitor';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-ip';
import { hashIp } from '@/lib/hash-ip';

export const runtime = 'nodejs';

const pingLimit = rateLimit(20);

function todayTr(): string {
  return new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * Ziyaretçi ping'i: aynı IP'den günde tek bir kayıt oluşturur.
 * Aynı kullanıcı sekme kapatıp açsa, browser değiştirse bile aynı IP →
 * sayı artmaz (IP'nin hash'i ile dedup).
 *
 * Çerez/izleme onayı yoksa client zaten POST etmiyor (VisitorCount.tsx).
 */
export async function POST(req: NextRequest) {
  const rawIp = getClientIp(req);
  if (!pingLimit(rawIp))
    return NextResponse.json({ ok: false }, { status: 429 });

  // body opsiyonel — sessionId artık dedup'ın anahtarı değil, sadece legacy uyumluluk için
  let sessionId: string | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.sessionId === 'string') {
      sessionId = body.sessionId.slice(0, 64) || undefined;
    }
  } catch {
    // body olmasa da devam et
  }

  try {
    await connectDB();
    const date = todayTr();
    const ipHash = hashIp(rawIp);

    // (date, ipHash) unique → aynı IP için aynı gün ikinci insert sessizce yoksayılır.
    // findOneAndUpdate + upsert pattern duplicate key hatasını yutar ve idempotent çalışır.
    await DailyVisitor.findOneAndUpdate(
      { date, ipHash },
      { $setOnInsert: { date, ipHash, sessionId, createdAt: new Date() } },
      { upsert: true },
    );

    // Sadece ipHash'i set olan yeni-pattern kayıtları say. Önceki sessionId-only
    // kayıtlar (varsa) 48h TTL ile zaten temizleniyor; geçiş penceresinde
    // sayıyı şişirmesin.
    const count = await DailyVisitor.countDocuments({
      date,
      ipHash: { $exists: true, $ne: null },
    });
    return NextResponse.json({ ok: true, count });
  } catch (err) {
    // Duplicate key (11000) — zaten kayıt var, sadece sayıyı dön
    const e = err as { code?: number };
    if (e?.code === 11000) {
      try {
        const count = await DailyVisitor.countDocuments({ date: todayTr() });
        return NextResponse.json({ ok: true, count });
      } catch {
        return NextResponse.json({ ok: false }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const count = await DailyVisitor.countDocuments({
      date: todayTr(),
      ipHash: { $exists: true, $ne: null },
    });
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
