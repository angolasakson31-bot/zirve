import { connectDB } from './mongoose';
import SiteSettings from '@/models/SiteSettings';

// In-memory cache pattern (Render free tier — tek instance).
declare global {
  // eslint-disable-next-line no-var
  var __reportThresholdCache: { value: number; t: number } | undefined;
}

const CACHE_TTL_MS = 10_000;
const SETTINGS_KEY = 'reportAutoHideThreshold';
const DEFAULT_THRESHOLD = 10;
const MIN_THRESHOLD = 1;
const MAX_THRESHOLD = 100;

/**
 * Bir fotoğrafa kaç farklı şikâyet geldikten sonra otomatik gizlenir?
 * Admin paneli üzerinden 1-100 arası ayarlanabilir, varsayılan 10.
 */
export async function getReportAutoHideThreshold(): Promise<number> {
  const now = Date.now();
  if (global.__reportThresholdCache && now - global.__reportThresholdCache.t < CACHE_TTL_MS) {
    return global.__reportThresholdCache.value;
  }
  try {
    await connectDB();
    const doc = await SiteSettings.findOne({ key: SETTINGS_KEY }).lean();
    const raw = (doc as { value?: number } | null)?.value;
    const value =
      typeof raw === 'number' && Number.isInteger(raw) && raw >= MIN_THRESHOLD && raw <= MAX_THRESHOLD
        ? raw
        : DEFAULT_THRESHOLD;
    global.__reportThresholdCache = { value, t: now };
    return value;
  } catch {
    return DEFAULT_THRESHOLD;
  }
}

export async function setReportAutoHideThreshold(value: number): Promise<number> {
  const clamped = Math.max(MIN_THRESHOLD, Math.min(MAX_THRESHOLD, Math.round(value)));
  await connectDB();
  await SiteSettings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { value: clamped },
    { upsert: true },
  );
  resetReportThresholdCache();
  return clamped;
}

export function resetReportThresholdCache(): void {
  global.__reportThresholdCache = undefined;
}

export { MIN_THRESHOLD, MAX_THRESHOLD, DEFAULT_THRESHOLD };
