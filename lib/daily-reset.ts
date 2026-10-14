import Photo from '@/models/Photo';

const TZ_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC+3 (Türkiye)

/**
 * "isChampion=true + isArchived=true" tutarsız stale state'i tek atomik
 * aggregation pipeline ile temizler. Eğer championDate boşsa, createdAt'in
 * TR günü stringinden üretip set'ler — fotoğraf "Dünün Zirvesi" olarak
 * gösterilebilsin.
 *
 * Hem maybeRunDailyReset hem vote endpoint'i çağırır (defensive).
 */
export async function demoteStaleChampions(): Promise<void> {
  await Photo.updateMany(
    { isChampion: true, isArchived: true },
    [
      {
        $set: {
          isChampion: false,
          championDate: {
            $ifNull: [
              '$championDate',
              {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: { $add: ['$createdAt', TZ_OFFSET_MS] },
                },
              },
            ],
          },
        },
      },
    ],
  );
}

export function turkishStartOfDay(): Date {
  const nowTr = new Date(Date.now() + TZ_OFFSET_MS);
  nowTr.setUTCHours(0, 0, 0, 0);
  return new Date(nowTr.getTime() - TZ_OFFSET_MS);
}

export function toTurkishDateStr(date: Date): string {
  return new Date(date.getTime() + TZ_OFFSET_MS).toISOString().split('T')[0];
}

let lastResetCheck = 0;
let lastResetDay = '';

/**
 * Gün sonu işlemleri (throttle'sız). Hem sayfa istekleriyle tetiklenen
 * maybeRunDailyReset hem de gece yarısı cron'u bunu çağırır — iki yol aynı
 * mantığı kullanır.
 *   1) Dünden kalan şampiyonu demote et; championDate = fotoğrafın yüklendiği
 *      TR günü. (Günün Zirvesi yalnızca o gün yüklenen fotoğraflardan olur —
 *      admin set-champion da eski fotoğrafa isChampion vermez.)
 *   2) "isChampion=true + isArchived=true" tutarsız stale state'i temizle.
 *   3) Bugünden eski non-archived photoları arşivle.
 */
export async function runDailyReset(): Promise<{ championId: unknown; archived: number }> {
  const startOfToday = turkishStartOfDay();

  // Arşivli stale şampiyonlar 2. adımda (demoteStaleChampions) temizlenir.
  const oldChampion = await Photo.findOne({
    isChampion: true,
    isArchived: false,
    createdAt: { $lt: startOfToday },
  }).select('_id createdAt');
  if (oldChampion) {
    // save() tüm dokümanı yeniden doğrular; ilgisiz bir alan geçersizse taşıma
    // başarısız olurdu. Sadece iki alanı güncelle.
    await Photo.updateOne(
      { _id: oldChampion._id },
      { $set: { isChampion: false, championDate: toTurkishDateStr(oldChampion.createdAt as Date) } },
    );
  }

  await demoteStaleChampions();

  const result = await Photo.updateMany(
    { isArchived: false, createdAt: { $lt: startOfToday } },
    { $set: { isArchived: true } },
  );

  return { championId: oldChampion?._id ?? null, archived: result.modifiedCount };
}

/**
 * Sayfa istekleriyle tetiklenen günlük temizlik. Aynı gün içinde en fazla
 * 60 saniyede bir runDailyReset çalıştırır (idempotent).
 */
export async function maybeRunDailyReset(): Promise<void> {
  const now = Date.now();
  const todayStr = new Date(now + 3 * 3600_000).toISOString().slice(0, 10);
  // Aynı gün içinde en fazla 60 saniyede bir kontrol et
  if (todayStr === lastResetDay && now - lastResetCheck < 60_000) return;
  lastResetCheck = now;
  lastResetDay = todayStr;

  try {
    await runDailyReset();
  } catch (err) {
    // Hata olursa bir sonraki istekte tekrar dene
    lastResetCheck = 0;
    throw err;
  }
}
