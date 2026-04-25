// Cloudinary URL'sine tiled text watermark transformation ekler.
// Admin panel doğrudan DB'den gelen orijinal URL'i kullandığı için bu fonksiyon
// sadece public-facing componentlerde çağrılır.
const WATERMARK_TEXT = 'zirve-app-node%2Eonrender%2Ecom';
const WATERMARK_LAYER = `l_text:Arial_26_bold:${WATERMARK_TEXT},co_white,o_40,a_-25,fl_tiled`;

export function addWatermark(url: string): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/${WATERMARK_LAYER}/`);
}
