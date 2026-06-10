import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-ip';
import { createAgeToken, AGE_COOKIE_NAME } from '@/lib/age-token';

export const runtime = 'nodejs';

const checkLimit = rateLimit(10);

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkLimit(ip))
    return NextResponse.json({ ok: false, error: 'Çok fazla istek.' }, { status: 429 });

  try {
    const { token, maxAge } = await createAgeToken();
    const res = NextResponse.json({ ok: true });
    res.cookies.set({
      name: AGE_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge,
      path: '/',
    });
    return res;
  } catch (err) {
    console.error('age/confirm error:', err);
    return NextResponse.json({ ok: false, error: 'Doğrulama oluşturulamadı.' }, { status: 500 });
  }
}
