import { NextRequest } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { rateLimit } from './rate-limit';
import { getClientIp } from './get-ip';

const adminLimit = rateLimit(10);

export function checkAdmin(req: NextRequest): number | null {
  const ip = getClientIp(req);
  if (!adminLimit(ip)) return 429;

  const provided = req.headers.get('x-admin-password') ?? '';
  const expected = process.env.ADMIN_PASSWORD ?? '';
  if (!expected) return 401;
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  ) return 401;

  return null;
}
