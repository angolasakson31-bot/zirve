// Cloudinary URL'sine tiled text watermark transformation ekler.
// Admin panel doğrudan DB'den gelen orijinal URL'i kullandığı için bu fonksiyon
// sadece public-facing componentlerde çağrılır.
//
// ESKİ HAL (geri almak için): Arial_40_bold, o_40, a_-25, fl_tiled — tek katman
const WATERMARK_TEXT = 'zirve-app-node%2Eonrender%2Ecom';

// Katman 1: büyük, -25°, tiled, %60 opacity, siyah stroke
const LAYER_1 = `l_text:Arial_44_bold:${WATERMARK_TEXT},co_white,o_60,a_-25,bo_3px_solid_black,fl_tiled`;
// Katman 2: orta boy, +20°, tiled, %35 opacity — farklı açıyla çapraz örüntü
const LAYER_2 = `l_text:Arial_28_bold:${WATERMARK_TEXT},co_white,o_35,a_20,fl_tiled`;

export function addWatermark(url: string): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/${LAYER_1}/${LAYER_2}/`);
}
