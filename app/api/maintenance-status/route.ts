import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import SiteSettings from '@/models/SiteSettings';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await connectDB();
    const doc = await SiteSettings.findOne({ key: 'maintenanceMode' }).lean();
    const maintenance = (doc as any)?.value === true;
    const res = NextResponse.json({ maintenance });
    res.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=5');
    return res;
  } catch {
    return NextResponse.json({ maintenance: false });
  }
}
