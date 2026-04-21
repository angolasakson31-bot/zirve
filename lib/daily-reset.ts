import Photo from '@/models/Photo';

export async function maybeRunDailyReset(): Promise<void> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const stale = await Photo.findOne({ isArchived: false, createdAt: { $lt: startOfToday } }).lean();
  if (!stale) return;

  const champion = await Photo.findOne({ isChampion: true, createdAt: { $lt: startOfToday } });
  if (champion) {
    champion.championDate = (champion.createdAt as Date).toISOString().split('T')[0];
    champion.isChampion = false;
    await champion.save();
  }

  await Photo.updateMany(
    { isArchived: false, createdAt: { $lt: startOfToday } },
    { $set: { isArchived: true } },
  );
}
