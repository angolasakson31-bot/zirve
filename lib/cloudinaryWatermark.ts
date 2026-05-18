// Cloudinary URL'sine tiled text watermark transformation ekler.
// Admin panel doğrudan DB'den gelen orijinal URL'i kullandığı için bu fonksiyon
// sadece public-facing componentlerde çağrılır.
const domain = process.env.NEXT_PUBLIC_SITE_DOMAIN ?? 'zirve-app-node.onrender.com';
const WATERMARK_TEXT = domain.replace(/\./g, '%2E');
const WATERMARK_LAYER = `l_text:Arial_40_bold:${WATERMARK_TEXT},co_white,o_40,a_-25,fl_tiled`;

// Tam çözünürlük (ana puanlama kartı, lightbox)
export function addWatermark(url: string): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/${WATERMARK_LAYER}/f_auto,q_75/`);
}

// Küçük thumbnail (sıralama şeridi, albüm thumbları) — küçük watermark + crop.
// 60+ fotoğrafın olduğu liste ekranlarında bandwidth'i 20-40x azaltır.
// Cloudinary'den ~5-10KB döner, orijinal 200-500KB yerine.
export function thumbUrl(url: string, size: number = 128): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  // Küçük thumb'a büyük watermark anlamsız — küçük watermark koy (24pt yerine 12pt)
  const smallWatermark = `l_text:Arial_16_bold:${WATERMARK_TEXT},co_white,o_30,a_-25,fl_tiled`;
  return url.replace(
    '/upload/',
    `/upload/${smallWatermark}/f_auto,q_70,w_${size},h_${size},c_fill,g_auto/`,
  );
}

// Orta boy (lider kartının ana fotoğrafı, ~280-400px ekran boyutu)
export function mediumUrl(url: string, maxWidth: number = 800): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  return url.replace(
    '/upload/',
    `/upload/${WATERMARK_LAYER}/f_auto,q_75,w_${maxWidth},c_limit/`,
  );
}

// Filigransız ama optimize edilmiş (admin panel, vs.)
export function optimizeUrl(url: string): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/f_auto,q_80/');
}

// Sansürlü — ana fotoğraf (lider kartı). Önce 800px'e scale, sonra pixelate.
// Bu sıra kritik: orijinal büyük görsele e_pixelate uygularsan
// thumbnail'a crop yapınca bloklar görünmez olur.
export function pixelateUrl(url: string, blockSize: number = 24): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/w_800,c_scale/e_pixelate:${blockSize}/f_auto,q_60/`);
}

// Sansürlü — küçük thumbnail (sıralama şeridi, albüm). Önce crop, sonra pixelate.
export function thumbPixelateUrl(url: string, size: number = 128, blockSize: number = 6): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  return url.replace(
    '/upload/',
    `/upload/w_${size},h_${size},c_fill,g_auto/e_pixelate:${blockSize}/f_auto,q_60/`,
  );
}
