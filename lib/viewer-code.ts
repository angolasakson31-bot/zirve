import { createHmac } from 'crypto';

// Kişiye özel filigran kodu. IP hash'inden türetilir; geri çevrilemez.
// Aynı IP her zaman aynı kodu alır → sızan bir ekran görüntüsündeki kod
// admin panelinden sorgulanıp ilgili IP hash'i engellenebilir.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // karışan karakterler (0/O, 1/I) yok
export const VIEWER_CODE_RE = /^[A-HJ-NP-Z2-9]{6}$/;

export function viewerCodeFromIpHash(ipHash: string): string {
  const salt = process.env.IP_SALT;
  if (!salt) throw new Error('IP_SALT environment variable must be set');
  const digest = createHmac('sha256', salt).update(`wm:${ipHash}`).digest();
  let code = '';
  for (let i = 0; i < 6; i++) code += ALPHABET[digest[i] % ALPHABET.length];
  return code;
}
