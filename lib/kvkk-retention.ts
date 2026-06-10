import Photo from '@/models/Photo';

// KVKK metninde belirtilen IP saklama süresi: 2 yıl.
const RETENTION_DAYS = 730;

/**
 * 2 yıldan eski fotoğrafların kişisel veri içeren alanlarını anonimleştirir.
 * Fotoğrafın kendisi (görsel + oy istatistikleri) korunur; sadece IP/hash
 * ve iletişim bilgisi temizlenir.
 *
 * KVKK Madde 7 uyarınca veri saklama süresi sonunda anonimleştirme zorunludur.
 */
export async function anonymizeOldPersonalData(): Promise<{ anonymized: number }> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const result = await Photo.updateMany(
    {
      createdAt: { $lt: cutoff },
      // Zaten anonimleştirilmiş olanları tekrar işleme — uploaderIp boş ise atla
      uploaderIp: { $ne: '' },
    },
    {
      $set: {
        uploaderIp:     '',
        uploaderDevice: '',
        contactInfo:    '',
        voters:         [],
        deviceVoters:   [],
        // Yorumların userHash'larını da temizle (yorum metnini koru)
        'comments.$[].userHash': '',
      },
    },
  );

  return { anonymized: result.modifiedCount };
}
