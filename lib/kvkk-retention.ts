import Photo from '@/models/Photo';
import cloudinary from '@/lib/cloudinary';

// KVKK metninde belirtilen saklama süresi: 2 yıl.
const RETENTION_DAYS = 730;

async function destroyCloudinaryAsset(publicId: string): Promise<void> {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch {
    // Sessizce yoksay — Cloudinary erişimi yoksa veya zaten silinmişse.
  }
}

/**
 * 2 yıldan eski ARŞİVLENMİŞ fotoğrafların kişisel veri alanlarını anonimleştirir
 * ve Cloudinary'deki görseli kalıcı olarak siler.
 *
 * NOT: Filtreye `isArchived: true` koyuyoruz — aksi halde aktif yarışmadaki
 * eski fotoğrafların voter dizisi temizlenir ve oy tekilleştirmesi kırılırdı.
 *
 * KVKK Madde 7 uyarınca veri saklama süresi sonunda anonimleştirme ve
 * silme zorunludur.
 */
export async function anonymizeOldPersonalData(): Promise<{
  anonymized: number;
  cloudinaryDeleted: number;
  cloudinaryFailed: number;
}> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  // Önce silinecek/anonimleştirilecek fotoğrafları bul
  const candidates = await Photo.find(
    {
      createdAt: { $lt: cutoff },
      isArchived: true,
      uploaderIp: { $ne: '' },
    },
    { _id: 1, cloudinaryId: 1 },
  ).lean();

  if (candidates.length === 0) {
    return { anonymized: 0, cloudinaryDeleted: 0, cloudinaryFailed: 0 };
  }

  // Cloudinary'den sil
  let cloudinaryDeleted = 0;
  let cloudinaryFailed = 0;
  for (const c of candidates) {
    try {
      await destroyCloudinaryAsset((c as { cloudinaryId?: string }).cloudinaryId ?? '');
      cloudinaryDeleted++;
    } catch {
      cloudinaryFailed++;
    }
  }

  // DB'de PII alanlarını anonimleştir (görsel URL'leri de boşalt — Cloudinary'de yok artık)
  const ids = candidates.map(c => c._id);
  const result = await Photo.updateMany(
    { _id: { $in: ids } },
    {
      $set: {
        uploaderIp:     '',
        uploaderDevice: '',
        contactInfo:    '',
        voters:         [],
        deviceVoters:   [],
        url:            '',
        albumUrls:      [],
        cloudinaryId:   '',
        'comments.$[].userHash': '',
      },
    },
  );

  return {
    anonymized: result.modifiedCount,
    cloudinaryDeleted,
    cloudinaryFailed,
  };
}
