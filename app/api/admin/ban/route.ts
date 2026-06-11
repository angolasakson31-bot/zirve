import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongoose';
import BannedIP from '@/models/BannedIP';
import Photo from '@/models/Photo';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const authErr = checkAdmin(req);
  if (authErr !== null) return NextResponse.json({ error: authErr === 429 ? 'Çok fazla istek.' : 'Yetkisiz.' }, { status: authErr });
  await connectDB();
  const bans = await BannedIP.find({}).select('ip reason createdAt').lean();
  const hashes = bans.map((b: any) => b.ip);
  // Anonimleştirilmiş fotoğrafların boş url'lerini join'e dahil etme — broken
  // <img> render'ı önle. KVKK retention sonrası url alanı '' olabilir.
  const photos = await Photo.find({
    uploaderIp: { $in: hashes },
    url: { $ne: '' },
  }).select('uploaderIp url').lean();
  const photoByIp = new Map(photos.map((p: any) => [p.uploaderIp, p.url]));
  const result = bans.map((b: any) => ({ ...b, photoUrl: photoByIp.get(b.ip) ?? null }));
  return NextResponse.json({ bans: result });
}

// Admin panelinden gönderilen "ip" değeri Photo.uploaderIp'tir; bu da
// hashIp() sonucu olan 64 karakterlik hex'tir. Yanlışlıkla ham IP girilirse
// runtime kontrolleriyle eşleşmeyeceği için ban etkisiz olur — bu yüzden
// formatı doğruluyoruz.
const HASH_RE = /^[0-9a-f]{64}$/;

export async function POST(req: NextRequest) {
  const authErr = checkAdmin(req);
  if (authErr !== null) return NextResponse.json({ error: authErr === 429 ? 'Çok fazla istek.' : 'Yetkisiz.' }, { status: authErr });
  const { ip, reason } = await req.json();
  if (!ip || typeof ip !== 'string')
    return NextResponse.json({ error: 'IP gerekli.' }, { status: 400 });
  const ipHash = ip.trim().toLowerCase();
  if (!HASH_RE.test(ipHash))
    return NextResponse.json({
      error: 'IP hash formatı geçersiz. Sadece fotoğraf kaydından gelen hash (64 hex) kabul edilir.',
    }, { status: 400 });
  await connectDB();
  await BannedIP.updateOne(
    { ip: ipHash },
    { ip: ipHash, reason: typeof reason === 'string' ? reason.slice(0, 200) : '' },
    { upsert: true }
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const authErr = checkAdmin(req);
  if (authErr !== null) return NextResponse.json({ error: authErr === 429 ? 'Çok fazla istek.' : 'Yetkisiz.' }, { status: authErr });
  const { ip } = await req.json();
  if (!ip) return NextResponse.json({ error: 'IP gerekli.' }, { status: 400 });
  await connectDB();
  await BannedIP.deleteOne({ ip });
  return NextResponse.json({ ok: true });
}
