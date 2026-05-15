// Cloudinary URL'sine tiled text watermark transformation ekler.
// Admin panel doğrudan DB'den gelen orijinal URL'i kullandığı için bu fonksiyon
// sadece public-facing componentlerde çağrılır.
const domain = process.env.NEXT_PUBLIC_SITE_DOMAIN ?? 'zirve-app-node.onrender.com';
const WATERMARK_TEXT = domain.replace(/\./g, '%2E');
const WATERMARK_LAYER = `l_text:Arial_40_bold:${WATERMARK_TEXT},co_white,o_40,a_-25,fl_tiled`;

export function addWatermark(url: string): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/${WATERMARK_LAYER}/`);
}
