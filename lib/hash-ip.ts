import { createHmac } from 'crypto';

export function hashIp(ip: string): string {
  const salt = process.env.IP_SALT;
  if (!salt) throw new Error('IP_SALT environment variable must be set');
  return createHmac('sha256', salt).update(ip).digest('hex');
}
