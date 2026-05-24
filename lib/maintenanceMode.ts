import { connectDB } from '@/lib/mongoose';
import SiteSettings from '@/models/SiteSettings';

declare global {
  // eslint-disable-next-line no-var
  var __maintenanceCache: { on: boolean; t: number } | undefined;
}

export async function isMaintenanceOn(): Promise<boolean> {
  const now = Date.now();
  if (global.__maintenanceCache && now - global.__maintenanceCache.t < 10_000) {
    return global.__maintenanceCache.on;
  }
  try {
    await connectDB();
    const doc = await SiteSettings.findOne({ key: 'maintenanceMode' }).lean();
    const on = (doc as any)?.value === true;
    global.__maintenanceCache = { on, t: now };
    return on;
  } catch {
    return false;
  }
}

export function resetMaintenanceCache() {
  global.__maintenanceCache = undefined;
}
