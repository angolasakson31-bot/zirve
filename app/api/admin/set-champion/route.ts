import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { checkAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongoose';
import Photo from '@/models/Photo';
import { invalidateLeaderCache } from '@/lib/leader-cache';

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
      invalidateLeaderCache();
      return NextResponse.json({ ok: true, champion: null });
    }

    // Diğer tüm şampiyonları temizle (eşzamanlı çift şampiyon riskini önle).
    // Sonra seçilen fotoğrafı şampiyon yap. Unique partial index sayesinde
    // çift şampiyon mümkün değil; çakışırsa retry et.
    let attempts = 0;
    while (attempts++ < 3) {
      await Photo.updateMany({ isChampion: true }, { $set: { isChampion: false } });
      try {
        await Photo.findByIdAndUpdate(photoId, { $set: { isChampion: true } });
        break;
      } catch (err) {
        const e = err as { code?: number };
        if (e?.code !== 11000 || attempts >= 3) throw err;
        // 11000: başka biri arada şampiyon yaptı; tekrar dene
      }
    }

    invalidateLeaderCache();
    return NextResponse.json({ ok: true, champion: photoId });
  } catch {
    return NextResponse.json({ error: 'İşlem başarısız.' }, { status: 500 });
  }
}
