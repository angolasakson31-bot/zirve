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
 * Günlük temizlik:
 *   1) Dünden kalan şampiyonu demote et (championDate = createdAt'in TR günü).
 *   2) "isChampion=true + isArchived=true" gibi tutarsız stale state'i temizle.
 *   3) Bugünden eski non-archived photoları arşivle.
 *
 * Idempotent — birden fazla çağrılsa bile yanlış sonuç üretmez. Her endpoint
 * GET'inde 60 sn cache ile no-op olur.
 */
export async function maybeRunDailyReset(): Promise<void> {
  const now = Date.now();
  const todayStr = new Date(now + 3 * 3600_000).toISOString().slice(0, 10);
  // Aynı gün içinde en fazla 60 saniyede bir kontrol et
  if (todayStr === lastResetDay && now - lastResetCheck < 60_000) return;
  lastResetCheck = now;
  lastResetDay = todayStr;

  const startOfToday = turkishStartOfDay();

  // 1) Dünden gelen şampiyonu demote et — championDate set'le ki "Dünün Zirvesi"
  //    olarak gösterilebilsin.
  const oldChampion = await Photo.findOne({
    isChampion: true,
    createdAt: { $lt: startOfToday },
  });
  if (oldChampion) {
    oldChampion.championDate = toTurkishDateStr(oldChampion.createdAt as Date);
    oldChampion.isChampion = false;
    await oldChampion.save();
  }

  // 2) Tutarsız stale state cleanup: isChampion=true ama isArchived=true olan
  //    fotoğraflar yeni şampiyon seçimini engelliyordu. Tek atomik pipeline
  //    update — championDate yoksa createdAt'tan üretilir.
  await demoteStaleChampions();

  // 3) Bugünden eski non-archived photoları arşivle.
  await Photo.updateMany(
    { isArchived: false, createdAt: { $lt: startOfToday } },
    { $set: { isArchived: true } },
  );
}
