import { NextRequest } from 'next/server';
import { rateLimit } from './rate-limit';

const adminLimit = rateLimit(10);

export function checkAdmin(req: NextRequest): number | null {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '0.0.0.0';
  if (!adminLimit(ip)) return 429;
  if (req.headers.get('x-admin-password') !== process.env.ADMIN_PASSWORD) return 401;
  return null;
}
