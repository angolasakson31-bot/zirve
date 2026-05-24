import { connectDB } from '@/lib/mongoose';
import SiteSettings from '@/models/SiteSettings';
import BannedIP from '@/models/BannedIP';

declare global {
  // eslint-disable-next-line no-var
  var __maintenanceCache: { on: boolean; t: number } | undefined;
  // eslint-disable-next-line no-var
  var __banCache: Map<string, { banned: boolean; t: number }> | undefined;
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

export async function isBannedIp(ip: string): Promise<boolean> {
  const now = Date.now();
  if (!global.__banCache) {
    global.__banCache = new Map();
  }
  const cached = global.__banCache.get(ip);
  if (cached && now - cached.t < 10_000) {
    return cached.banned;
  }
  try {
    await connectDB();
    const doc = await BannedIP.findOne({ ip }).lean();
    const banned = doc != null;
    global.__banCache.set(ip, { banned, t: now });
    return banned;
  } catch {
    return false;
  }
}
