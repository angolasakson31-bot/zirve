// Çerez/izleme onayı için merkezi yardımcı.
// Tek bir localStorage anahtarı (zirve_cookie_consent) kullanılır.
// 'accepted' true ise: ziyaretçi ping'i + non-essential tracking serbest.
// 'accepted' false ise: yalnızca zorunlu (oturum/yaş) işlevler çalışır.
// null ise: kullanıcı henüz karar vermedi — defansif olarak reddedilmiş say.

export const CONSENT_KEY = 'zirve_cookie_consent';
export const CONSENT_EVENT = 'zirve:consentChanged';
export const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export interface ConsentRecord {
  accepted: boolean;
  at: number;
}

export function readConsent(): ConsentRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (Date.now() - parsed.at > ONE_YEAR_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeConsent(accepted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted, at: Date.now() }));
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: { accepted } }));
  } catch {}
}

// Non-essential tracking (ziyaretçi sayacı, vb.) için kontrol.
// Karar henüz verilmediyse de izin verilmiş sayma.
export function hasTrackingConsent(): boolean {
  const c = readConsent();
  return c !== null && c.accepted === true;
}
