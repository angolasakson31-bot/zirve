import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { isPreModerationEnabled, setPreModerationEnabled } from '@/lib/pre-moderation';

export const runtime = 'nodejs';

// GET → mevcut durumu döner
export async function GET(req: NextRequest) {
  const authErr = checkAdmin(req);
  if (authErr !== null)
    return NextResponse.json(
      { error: authErr === 429 ? 'Çok fazla istek.' : 'Yetkisiz.' },
      { status: authErr },
    );

  const enabled = await isPreModerationEnabled();
  return NextResponse.json({ enabled });
}

// POST → durumu set eder ({ enabled: boolean })
export async function POST(req: NextRequest) {
  const authErr = checkAdmin(req);
  if (authErr !== null)
    return NextResponse.json(
      { error: authErr === 429 ? 'Çok fazla istek.' : 'Yetkisiz.' },
      { status: authErr },
    );

  try {
    const body = await req.json();
    const enabled = body?.enabled === true;
    await setPreModerationEnabled(enabled);
    return NextResponse.json({ ok: true, enabled });
  } catch {
    return NextResponse.json({ error: 'İşlem başarısız.' }, { status: 500 });
  }
}
