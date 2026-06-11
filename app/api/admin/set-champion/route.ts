import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { checkAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';

export const runtime = 'nodejs';

// Admin'in oy/tarih kısıtı olmadan herhangi bir fotoğrafı doğrudan şampiyon
// yapmasını sağlar. Otomatik şampiyon hesabı bu seçimi sonradan değiştirebilir
// (oylar geldikçe), ama anında dünün veya bugünün herhangi bir fotoğrafını
// manuel olarak şampiyon koltuğuna oturtmak için kullanılır.
export async function POST(req: NextRequest) {
  const authErr = checkAdmin(req);
  if (authErr !== null)
    return NextResponse.json(
      { error: authErr === 429 ? 'Çok fazla istek.' : 'Yetkisiz.' },
      { status: authErr },
    );

  try {
    const { photoId, unset } = await req.json();
    if (!photoId || typeof photoId !== 'string' || !mongoose.Types.ObjectId.isValid(photoId))
      return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });

    await connectDB();

    const photo = await Photo.findById(photoId).select('_id isChampion');
    if (!photo)
      return NextResponse.json({ error: 'Fotoğraf bulunamadı.' }, { status: 404 });

    if (unset === true) {
      // Sadece bu fotoğrafın şampiyonluğunu kaldır
      await Photo.findByIdAndUpdate(photoId, { $set: { isChampion: false } });
      return NextResponse.json({ ok: true, champion: null });
    }

    // Diğer tüm şampiyonları temizle (eşzamanlı çift şampiyon riskini önle)
    await Photo.updateMany({ isChampion: true }, { $set: { isChampion: false } });
    // Seçilen fotoğrafı şampiyon yap
    await Photo.findByIdAndUpdate(photoId, { $set: { isChampion: true } });

    return NextResponse.json({ ok: true, champion: photoId });
  } catch {
    return NextResponse.json({ error: 'İşlem başarısız.' }, { status: 500 });
  }
}
