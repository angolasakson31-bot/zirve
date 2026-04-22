import Photo from '@/models/Photo';

const TZ_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC+3 (Türkiye)

export function turkishStartOfDay(): Date {
  const nowTr = new Date(Date.now() + TZ_OFFSET_MS);
  nowTr.setUTCHours(0, 0, 0, 0);
  return new Date(nowTr.getTime() - TZ_OFFSET_MS);
}

export function toTurkishDateStr(date: Date): string {
  return new Date(date.getTime() + TZ_OFFSET_MS).toISOString().split('T')[0];
}

export async function maybeRunDailyReset(): Promise<void> {
  const startOfToday = turkishStartOfDay();

  const stale = await Photo.findOne({ isArchived: false, createdAt: { $lt: startOfToday } }).lean();
  if (!stale) return;

  const champion = await Photo.findOne({ isChampion: true, createdAt: { $lt: startOfToday } });
  if (champion) {
    champion.championDate = toTurkishDateStr(champion.createdAt as Date);
    champion.isChampion = false;
    await champion.save();
  }

  await Photo.updateMany(
    { isArchived: false, createdAt: { $lt: startOfToday } },
    { $set: { isArchived: true } },
  );
}
