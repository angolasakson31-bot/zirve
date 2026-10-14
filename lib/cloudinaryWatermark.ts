// Cloudinary URL'sine ortadan geçen tek çapraz site adı filigranı ekler.
// Admin panel doğrudan DB'den gelen orijinal URL'i kullandığı için bu fonksiyon
// sadece public-facing componentlerde çağrılır.
const domain = process.env.NEXT_PUBLIC_SITE_DOMAIN ?? 'zirve-app-node.onrender.com';
const WATERMARK_TEXT  = domain.replace(/\./g, '..');
// Yazı boyutu piksel cinsinden olduğu için önce sabit boyuta küçültülür;
// böylece filigran her fotoğrafta aynı oranda görünür (ve sızan kopya
// tam çözünürlükte olmaz).
const WATERMARK_RESIZE = 'c_limit,w_1200,h_1500';
const WATERMARK_LAYER = `l_text:Arial_54_bold:${WATERMARK_TEXT},co_white,o_35,a_-25`;

export function addWatermark(url: string): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/${WATERMARK_RESIZE}/${WATERMARK_LAYER}/f_auto,q_75/`);
}

// Filigransız ama optimize edilmiş (admin panel, vs.)
export function optimizeUrl(url: string): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/f_auto,q_80/');
}

// Küçük thumbnail alıp CSS ile büyütünce pixellenmiş görünür (canvas yok)
export function pixelateUrl(url: string, width = 40): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/w_${width},c_scale/`);
}

// Kare thumbnail (albüm şeridi, liderlik kartları için)
export function pixelateUrlSquare(url: string, size = 8): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/w_${size},h_${size},c_fill/`);
}
