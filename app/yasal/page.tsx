import type { Metadata } from 'next';
import Link from 'next/link';
import { Mountain } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Yasal Uyarı ve Kullanım Koşulları — Zirve X',
  description: 'Zirve X platformuna ait yasal uyarı, kullanım koşulları ve gizlilik politikası.',
};

// Saatte bir yeniden oluştur — dinamik tarih damgası ay değiştiğinde
// otomatik güncellenir.
export const revalidate = 3600;

const CONTACT_EMAIL = 'angolasakson34@gmail.com';
const CONTACT_TELEGRAM = '@zirvex_destek';

function currentUpdateDate(): string {
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
  ];
  const now = new Date();
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="font-bold text-zinc-300 text-sm border-l-2 border-amber-400 pl-3">{title}</h2>
      <div className="text-zinc-500 text-xs leading-relaxed space-y-2 pl-3">{children}</div>
    </div>
  );
}

export default function YasalPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="p-1.5 bg-amber-400/10 rounded-lg">
              <Mountain className="w-4 h-4 text-amber-400" />
            </div>
            <span className="font-black text-base tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              ZİRVE X
            </span>
          </Link>
          <span className="text-zinc-600 text-xs ml-1">/ Yasal Uyarı</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-black text-white mb-1">Yasal Uyarı ve Kullanım Koşulları</h1>
          <p className="text-zinc-600 text-xs">Son güncelleme: {currentUpdateDate()}</p>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-300 leading-relaxed">
          Bu siteyi kullanarak aşağıdaki tüm koşulları okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan etmiş olursunuz.
          Kabul etmiyorsanız siteyi kullanmayınız.
        </div>

        <div className="space-y-6">

          {/* 18+ */}
          <Section title="1. Yaş Sınırı">
            <p>
              Bu platform yalnızca <strong className="text-zinc-400">18 yaş ve üzeri</strong> kullanıcılara yöneliktir.
              Siteye erişim sağlayarak 18 yaşını doldurduğunuzu beyan etmiş olursunuz.
              Reşit olmayan kişilerin siteye erişimi kesinlikle yasaktır.
              Platform, yaş doğrulama yükümlülüğünü yerine getirme sorumluluğunu kullanıcıya bırakır.
            </p>
          </Section>

          {/* Açık rıza */}
          <Section title="2. Açık Rıza ve İçerik Sorumluluğu">
            <p>
              Platforma fotoğraf yükleyen kullanıcı; yüklediği içerikte yer alan tüm kişilerin{' '}
              <strong className="text-zinc-400">açık ve özgür rızasını önceden aldığını</strong> beyan ve
              taahhüt eder. Başkasına ait fotoğrafları izinsiz yüklemek{' '}
              <strong className="text-zinc-400">TCK Madde 134</strong> (özel hayatın gizliliğini ihlal)
              kapsamında suç teşkil eder. Hukuki ve cezai sorumluluk tamamen içeriği yükleyen
              kullanıcıya aittir; platform yönetimi bu tür ihlallerden hiçbir şekilde sorumlu tutulamaz.
            </p>
          </Section>

          {/* NCII */}
          <Section title="3. Rıza Dışı Mahrem İçerik Yasağı (NCII)">
            <p>
              Kişinin açık rızası olmaksızın paylaşılan mahrem görüntüler kesinlikle{' '}
              <strong className="text-zinc-400">yasaktır</strong>. Bu tür içerikler{' '}
              <strong className="text-zinc-400">TCK Madde 134</strong> (özel hayatın gizliliği) ve{' '}
              <strong className="text-zinc-400">TCK Madde 226</strong> (müstehcenlik) kapsamında ağır
              cezai yaptırım gerektirir. Tespit edilen her içerik derhal ve kalıcı olarak kaldırılır;
              gerektiğinde yetkili mercilere suç duyurusunda bulunulur. Mağdurlar içerik kaldırma
              talebini aşağıdaki iletişim kanallarından iletebilir.
            </p>
          </Section>

          {/* Kişilik hakları */}
          <Section title="4. Kişilik Hakları (TMK Madde 24–25)">
            <p>
              Türk Medeni Kanunu Madde 24–25 kapsamında kişilik haklarına saldırı niteliğindeki
              içerikler yasaktır. Kişilik haklarının ihlal edildiğini düşünen kullanıcılar,
              içerik kaldırma talebini platform iletişim kanallarına iletebilir. Platform yönetimi,
              ihlal tespiti hâlinde içeriği önceden bildirim gerekmeksizin kaldırma hakkını saklı tutar.
            </p>
          </Section>

          {/* Yasaklı içerikler */}
          <Section title="5. Yasaklı İçerikler">
            <p>Aşağıdaki içeriklerin yüklenmesi kesinlikle yasaktır:</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>18 yaşından küçüklere ait her türlü içerik (<strong className="text-zinc-400">TCK 226/3</strong>)</li>
              <li>Müstehcen veya pornografik materyal (<strong className="text-zinc-400">TCK 226</strong>)</li>
              <li>Hakaret, iftira veya aşağılayıcı içerik (<strong className="text-zinc-400">TCK 125–131</strong>)</li>
              <li>Kişisel verileri ifşa eden içerik (<strong className="text-zinc-400">KVKK / TCK 135</strong>)</li>
              <li>Telif hakkı ihlali içeren materyal (<strong className="text-zinc-400">FSEK 5846</strong>)</li>
            </ul>
            <p>
              Tespit edilen ihlaller derhal kaldırılır; gerektiğinde yetkili mercilere bildirim yapılır.
              Platform bu tür içerikler nedeniyle hiçbir hukuki sorumluluk kabul etmez.
            </p>
          </Section>

          {/* Yorum sorumluluğu */}
          <Section title="6. Kullanıcı Yorumları">
            <p>
              Platforma yapılan yorumlar tamamen kullanıcıların sorumluluğundadır. Hakaret, iftira
              veya kişilik haklarını ihlal eden yorumlar{' '}
              <strong className="text-zinc-400">TCK Madde 125–131</strong> ve{' '}
              <strong className="text-zinc-400">TCK Madde 267</strong> kapsamında suç teşkil eder;
              hukuki sorumluluk yorumu yapan kullanıcıya aittir. Platform yönetimi, uygunsuz yorumları
              önceden bildirim gerekmeksizin kaldırma hakkını saklı tutar.
            </p>
          </Section>

          {/* Oy manipülasyonu */}
          <Section title="7. Oy ve Puanlama Sistemi">
            <p>
              Bot, otomatik araç, VPN rotasyonu veya herhangi bir yöntemle oy manipülasyonu yapmak
              kesinlikle yasaktır. Bu tür girişimler tespit edildiğinde ilgili IP adresleri kalıcı
              olarak engellenir. Platform, puanlama sisteminin bütünlüğünü korumak amacıyla oy
              verenlerin IP adreslerini teknik kayıt amacıyla saklama hakkını saklı tutar.
            </p>
          </Section>

          {/* Filigran */}
          <Section title="8. Fotoğraf Filigranı">
            <p>
              Platforma yüklenen tüm fotoğraflara platform alan adını içeren bir{' '}
              <strong className="text-zinc-400">dijital filigran (watermark)</strong> otomatik olarak
              eklenir. Bu işlem, içeriklerin platform dışına izinsiz taşınmasını önlemek amacıyla
              yapılmaktadır. Fotoğraf yükleyerek bu uygulamayı kabul etmiş olursunuz.
            </p>
          </Section>

          {/* 5651 */}
          <Section title="9. İçerik Kaldırma (5651 Sayılı Kanun)">
            <p>
              İnternet Ortamında Yapılan Yayınların Düzenlenmesi Hakkındaki{' '}
              <strong className="text-zinc-400">5651 Sayılı Kanun</strong> gereğince, hakkınızda
              izinsiz yayınlanan içeriklerin kaldırılmasını aşağıdaki kanallar aracılığıyla
              talep edebilirsiniz:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>
                E-posta:{' '}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-amber-500 hover:text-amber-400 underline underline-offset-2"
                >
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>Telegram: <strong className="text-zinc-400">{CONTACT_TELEGRAM}</strong></li>
            </ul>
            <p>
              Talepler en geç <strong className="text-zinc-400">48 saat</strong> içinde değerlendirilir.
              Talepte ad, içerik bağlantısı ve kimlik doğrulayan bilgi paylaşılması süreci hızlandırır.
            </p>
          </Section>

          {/* FSEK */}
          <Section title="10. Telif Hakları (FSEK — 5846 Sayılı Kanun)">
            <p>
              Platforma yüklenen içeriklerin telif hakları{' '}
              <strong className="text-zinc-400">5846 Sayılı Fikir ve Sanat Eserleri Kanunu</strong>{' '}
              kapsamında korunmaktadır. Başkasına ait telif hakkıyla korunan içeriklerin izinsiz
              yüklenmesinden doğacak tüm hukuki sorumluluk yükleyen kullanıcıya aittir.
            </p>
          </Section>

          {/* Veri Sorumlusu */}
          <Section title="11. Veri Sorumlusu Kimliği">
            <p>
              <strong className="text-zinc-400">Veri Sorumlusu:</strong> ZİRVE X platform yönetimi
            </p>
            <p>
              <strong className="text-zinc-400">İletişim:</strong>{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-amber-500 hover:text-amber-400 underline underline-offset-2">{CONTACT_EMAIL}</a>
              {' '}· Telegram: <strong className="text-zinc-400">{CONTACT_TELEGRAM}</strong>
            </p>
            <p className="text-zinc-600 text-[10px]">
              Not: Platform bireysel yönetimde olup tüzel kişilik statüsünde değildir.
              KVKK kapsamındaki başvurular yukarıdaki iletişim kanallarından yapılabilir.
            </p>
          </Section>

          {/* KVKK */}
          <Section title="12. Kişisel Verilerin Korunması (KVKK — 6698 Sayılı Kanun)">
            <p>
              Kişisel verileriniz <strong className="text-zinc-400">6698 Sayılı KVKK</strong>{' '}
              kapsamında işlenmektedir. Veri sorumlusu platform yönetimidir.
            </p>
            <p className="font-semibold text-zinc-400">İşlenen veriler ve amaçları:</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>
                <strong className="text-zinc-400">IP adresi:</strong> Fotoğraf yükleyen ve oy veren
                kullanıcıların IP adresleri; spam önleme, oy bütünlüğü ve yasal yükümlülük amacıyla
                sunucu kayıtlarında ve veritabanında saklanır.
              </li>
              <li>
                <strong className="text-zinc-400">İletişim bilgisi (opsiyonel):</strong> Kullanıcı
                takip kodu ile birlikte isteğe bağlı olarak bıraktığı iletişim bilgisi yalnızca
                kendisiyle iletişim kurulması amacıyla saklanır; üçüncü taraflarla paylaşılmaz.
              </li>
              <li>
                <strong className="text-zinc-400">Fotoğraf dosyası:</strong> Yüklenen görseller
                platform içi puanlama amacıyla kullanılır; ticari amaçla kullanılmaz veya üçüncü
                taraflarla paylaşılmaz.
              </li>
              <li>
                <strong className="text-zinc-400">Yorum hash değeri:</strong> Yorum yapan
                kullanıcıları tanımlamak için anonimleştirilmiş hash kaydı tutulur; gerçek kimlik
                veya IP doğrudan saklanmaz.
              </li>
            </ul>
            <p className="font-semibold text-zinc-400 mt-1">Uluslararası veri transferi:</p>
            <p>
              Yüklenen fotoğraflar,{' '}
              <strong className="text-zinc-400">Cloudinary Inc.</strong> (ABD) altyapısında
              depolanmaktadır. Bu işlem, KVKK Madde 9 kapsamında yurt dışına veri aktarımı
              niteliğindedir. Siteyi kullanarak bu aktarıma onay vermiş olursunuz.
            </p>
            <p className="font-semibold text-zinc-400 mt-1">Saklama süresi:</p>
            <p>
              Yüklenen fotoğraflar ve iletişim bilgileri, içerik kaldırılana veya platform
              kapatılana kadar saklanır. IP adresi kayıtları spam ve oy manipülasyonunun
              önlenmesi amacıyla en fazla <strong className="text-zinc-400">2 yıl</strong>{' '}
              süreyle saklanır; bu süre sonunda silinir veya anonimleştirilir.
            </p>
            <p className="font-semibold text-zinc-400 mt-1">Veri ihlali bildirimi (KVKK Madde 12):</p>
            <p>
              Kişisel veri güvenliğinin ihlal edildiğinin tespiti hâlinde, ilgili kişiler ve{' '}
              <strong className="text-zinc-400">Kişisel Verileri Koruma Kurulu</strong> yasal süre
              içinde (en geç 72 saat) bilgilendirilir.
            </p>
            <p className="font-semibold text-zinc-400 mt-1">KVKK kapsamındaki haklarınız:</p>
            <p>
              Kişisel verilerinize ilişkin bilgi alma, düzeltme, silme, işlemeyi kısıtlama ve
              işlemeye itiraz hakları için{' '}
              <Link href="/kvkk" className="text-amber-500 hover:text-amber-400 underline underline-offset-2">
                KVKK Başvuru Formu
              </Link>{' '}
              üzerinden veya{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-amber-500 hover:text-amber-400 underline underline-offset-2"
              >
                {CONTACT_EMAIL}
              </a>{' '}
              adresine başvurabilirsiniz.
            </p>
          </Section>

          {/* Çerez */}
          <Section title="13. Çerez Politikası">
            <p className="font-semibold text-zinc-400">Zorunlu çerezler (varsayılan):</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>
                <strong className="text-zinc-400">Yaş onayı:</strong> 18+ teyidi için tarayıcıda kısa
                ömürlü işaret ve sunucuda HttpOnly imzalı doğrulama çerezi.
              </li>
              <li>
                <strong className="text-zinc-400">Oturum yönetimi:</strong> Takip kodu görüntüleme
                ve fotoğraf yükleme akışları için tarayıcı yerel depolaması.
              </li>
            </ul>
            <p className="font-semibold text-zinc-400 mt-1">Onaylı çerezler (Kabul ederseniz):</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>
                <strong className="text-zinc-400">Ziyaretçi sayacı:</strong> Anonim oturum kimliği
                ile günlük tekil ziyaretçi sayısı tutulur. Onay vermezseniz bu kayıt yapılmaz —
                sadece toplam sayıyı görürsünüz.
              </li>
            </ul>
            <p className="mt-1">
              Üçüncü taraf reklam veya analitik çerezi kullanılmamaktadır. Çerez tercihinizi sayfanın
              alt köşesindeki banner üzerinden veya tarayıcı ayarlarınızdan değiştirebilirsiniz.
            </p>
          </Section>

          {/* Sorumluluk reddi */}
          <Section title="14. Sorumluluk Reddi">
            <p>
              Platform yönetimi; kullanıcılar tarafından yüklenen içeriklerin doğruluğundan,
              hukuka uygunluğundan veya üçüncü taraflara verdiği zarardan sorumlu tutulamaz.
              Tüm içerikler kullanıcılar tarafından gönüllü olarak paylaşılmaktadır. Platform,
              teknik arızalar, hizmet kesintileri veya veri kayıpları nedeniyle oluşabilecek
              zararlardan da sorumlu değildir.
            </p>
          </Section>

          {/* Erişim engeli */}
          <Section title="15. Erişimi Engelleme ve Hizmet Durdurma Hakkı">
            <p>
              Platform yönetimi; kurallara aykırı davranan kullanıcıların IP adresini önceden
              bildirim gerekmeksizin kalıcı olarak engelleyebilir. Platform, herhangi bir zamanda
              ve önceden bildirim gerekmeksizin hizmetini kısmen veya tamamen durdurma hakkını
              saklı tutar. Bu durum nedeniyle kullanıcılar herhangi bir tazminat talep edemez.
            </p>
          </Section>

          {/* Yetkili mahkeme */}
          <Section title="16. Uygulanacak Hukuk ve Yetkili Mahkeme">
            <p>
              Bu platformun kullanımından doğabilecek her türlü uyuşmazlıkta{' '}
              <strong className="text-zinc-400">Türkiye Cumhuriyeti hukuku</strong> uygulanır.
              Anlaşmazlıklarda{' '}
              <strong className="text-zinc-400">İstanbul Mahkemeleri ve İcra Daireleri</strong>{' '}
              yetkilidir.
            </p>
          </Section>

          {/* Değişiklik hakkı */}
          <Section title="17. Koşulların Güncellenmesi">
            <p>
              Platform yönetimi, yasal düzenlemeler veya platform politikalarındaki değişiklikler
              doğrultusunda bu koşulları önceden bildirmeksizin güncelleme hakkını saklı tutar.
              Güncel koşullar her zaman bu sayfada yayımlanır. Platformu kullanmaya devam etmeniz,
              güncel koşulları kabul ettiğiniz anlamına gelir.
            </p>
          </Section>

        </div>

        <div className="border-t border-zinc-800 pt-4 flex items-center justify-between">
          <p className="text-zinc-700 text-xs">
            Son güncelleme: {currentUpdateDate()} · © {new Date().getFullYear()} ZİRVE X
          </p>
          <Link
            href="/"
            className="text-xs text-amber-500 hover:text-amber-400 underline underline-offset-2"
          >
            ← Ana sayfaya dön
          </Link>
        </div>
      </div>
    </main>
  );
}
