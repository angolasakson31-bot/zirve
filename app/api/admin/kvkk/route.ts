import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { checkAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongoose';
import KvkkRequest from '@/models/KvkkRequest';

export const runtime = 'nodejs';

// GET → açık ve devam eden KVKK taleplerini listele
export async function GET(req: NextRequest) {
  const authErr = checkAdmin(req);
  if (authErr !== null)
    return NextResponse.json(
      { error: authErr === 429 ? 'Çok fazla istek.' : 'Yetkisiz.' },
      { status: authErr },
    );

  try {
    await connectDB();

    const items = await KvkkRequest.find({ status: { $ne: 'resolved' } })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return NextResponse.json({
      requests: items.map((r: any) => ({
        _id: String(r._id),
        name: r.name,
        email: r.email,
        requestType: r.requestType,
        details: r.details,
        trackingCode: r.trackingCode ?? '',
        status: r.status,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error('admin kvkk GET error:', err);
    return NextResponse.json({ error: 'Talepler alınamadı.' }, { status: 500 });
  }
}

// POST → bir talebin durumunu değiştir (in_progress, resolved)
export async function POST(req: NextRequest) {
  const authErr = checkAdmin(req);
  if (authErr !== null)
    return NextResponse.json(
      { error: authErr === 429 ? 'Çok fazla istek.' : 'Yetkisiz.' },
      { status: authErr },
    );

  try {
    const body = await req.json();
    const requestId = String(body.requestId ?? '');
    const status = String(body.status ?? '');

    if (!mongoose.Types.ObjectId.isValid(requestId))
      return NextResponse.json({ error: 'Geçersiz talep.' }, { status: 400 });
    if (!['open', 'in_progress', 'resolved'].includes(status))
      return NextResponse.json({ error: 'Geçersiz durum.' }, { status: 400 });

    await connectDB();
    await KvkkRequest.findByIdAndUpdate(requestId, { $set: { status } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('admin kvkk POST error:', err);
    return NextResponse.json({ error: 'İşlem başarısız.' }, { status: 500 });
  }
}
