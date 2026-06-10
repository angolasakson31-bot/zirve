// Yaş onayı için HMAC imzalı token üretimi/doğrulaması.
// Edge runtime'da (middleware) çalışabilmesi için Web Crypto API kullanılıyor.
//
// Token formatı: `${expSeconds}.${base64urlSig}`
// Signature = HMAC-SHA256(secret, expSeconds).

const TOKEN_TTL_SECONDS = 365 * 24 * 60 * 60; // 1 yıl

function getSecret(): string {
  // IP_SALT'ı yeniden kullanıyoruz — Render env'de zaten var, ekstra secret
  // yönetimi gerektirmez. Yetki gerektirmeyen kısa-ömürlü onay token'ı için
  // yeterli güvenlik sağlar.
  return process.env.IP_SALT ?? '';
}

function bufferToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  // btoa Node 20+ ve Edge runtime'da global
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(message: string): Promise<string> {
  const secret = getSecret();
  if (!secret) throw new Error('IP_SALT env değişkeni gerekli.');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return bufferToBase64Url(sig);
}

export async function createAgeToken(): Promise<{ token: string; maxAge: number }> {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const sig = await hmac(String(exp));
  return { token: `${exp}.${sig}`, maxAge: TOKEN_TTL_SECONDS };
}

export async function verifyAgeToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf('.');
  if (dot < 1) return false;
  const expStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = parseInt(expStr, 10);
  if (!Number.isFinite(exp)) return false;
  if (exp < Math.floor(Date.now() / 1000)) return false;
  try {
    const expected = await hmac(expStr);
    // Sabit-zaman karşılaştırması
    if (expected.length !== sig.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

export const AGE_COOKIE_NAME = 'zirve_age_token';
