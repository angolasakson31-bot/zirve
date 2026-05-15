import { createHmac } from 'crypto';

export function hashIp(ip: string): string {
  const salt = process.env.IP_SALT ?? 'zrv-default-salt';
  return createHmac('sha256', salt).update(ip).digest('hex');
}
