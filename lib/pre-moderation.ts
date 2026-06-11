import { connectDB } from './mongoose';
import SiteSettings from '@/models/SiteSettings';

// In-memory cache — Render free tier'da tek instance, kısa TTL yeterli.
// maintenanceMode.ts ile aynı pattern.
declare global {
  // eslint-disable-next-line no-var
  var __preModerationCache: { on: boolean; t: number } | undefined;
}

const CACHE_TTL_MS = 10_000;
const SETTINGS_KEY = 'preModerationEnabled';

/**
 * Pre-moderation (yeni yüklenen fotoğraflara onay zorunluluğu) aktif mi?
 * - TRUE  → yeni yüklenen fotoğraf isHidden=true + moderationStatus='pending'
 *           ile başlar, admin onayı gerekir
 * - FALSE → mevcut akış (otomatik yayın)
 */
export async function isPreModerationEnabled(): Promise<boolean> {
  const now = Date.now();
  if (global.__preModerationCache && now - global.__preModerationCache.t < CACHE_TTL_MS) {
    return global.__preModerationCache.on;
  }
  try {
    await connectDB();
    const doc = await SiteSettings.findOne({ key: SETTINGS_KEY }).lean();
    const on = (doc as { value?: boolean } | null)?.value === true;
    global.__preModerationCache = { on, t: now };
    return on;
  } catch {
    return false;
  }
}

export async function setPreModerationEnabled(value: boolean): Promise<void> {
  await connectDB();
  await SiteSettings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { value },
    { upsert: true },
  );
  resetPreModerationCache();
}

export function resetPreModerationCache(): void {
  global.__preModerationCache = undefined;
}
