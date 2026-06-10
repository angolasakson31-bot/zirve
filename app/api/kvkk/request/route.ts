import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import KvkkRequest, { KvkkRequestType } from '@/models/KvkkRequest';
import { rateLimit } from '@/lib/rate-limit';
import { hashIp } from '@/lib/hash-ip';
import { getClientIp } from '@/lib/get-ip';

export const runtime = 'nodejs';

const checkLimit = rateLimit(3);

const VALID_TYPES: KvkkRequestType[] = ['access', 'delete', 'correct', 'object', 'other'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitize(s: string, max: number): string {
  return s.replace(/<[^>]*>/g, '').trim().slice(0, max);
}

export async function POST(req: NextRequest) {
  const rawIp = getClientIp(req);
  if (!checkLimit(rawIp))
    return NextResponse.json({ error: 'Çok fazla talep. Lütfen daha sonra tekrar deneyin.' }, { status: 429 });

  try {
    const body = await req.json().catch(() => ({}));
    const name = sanitize(String(body.name ?? ''), 100);
    const email = sanitize(String(body.email ?? ''), 200);
    const requestType = String(body.requestType ?? '') as KvkkRequestType;
    const details = sanitize(String(body.details ?? ''), 2000);
    const trackingCode = sanitize(String(body.trackingCode ?? ''), 20);

    if (!name)   return NextResponse.json({ error: 'Ad-soyad zorunludur.' },     { status: 400 });
    if (!email || !EMAIL_RE.test(email))
      return NextResponse.json({ error: 'Geçerli bir e-posta giriniz.' },        { status: 400 });
    if (!VALID_TYPES.includes(requestType))
      return NextResponse.json({ error: 'Geçersiz talep türü.' },                { status: 400 });

    await connectDB();

    const ipHash = hashIp(rawIp);
    const doc = await KvkkRequest.create({
      name, email, requestType, details, trackingCode, ipHash,
    });

    return NextResponse.json({
      ok: true,
      requestId: String(doc._id),
      message: 'Talebiniz alındı. En geç 30 gün içinde yanıtlanacaktır.',
    });
  } catch (err) {
    console.error('kvkk request error:', err);
    return NextResponse.json({ error: 'Talep alınamadı.' }, { status: 500 });
  }
}
