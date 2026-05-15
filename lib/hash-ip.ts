import { createHmac } from 'crypto';

const IP_SALT = process.env.IP_SALT;
if (!IP_SALT) throw new Error('IP_SALT environment variable must be set');

export function hashIp(ip: string): string {
  return createHmac('sha256', IP_SALT!).update(ip).digest('hex');
}
