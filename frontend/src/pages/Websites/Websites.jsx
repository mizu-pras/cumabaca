import { useNsfwStore } from '@/stores/nsfwStore';

const websites = [
  {
    name: 'Komiku',
    baseUrl: 'https://komiku.org',
    domains: 'komiku.org, komiku.id',
    language: 'Indonesia',
    method: 'HTTP Scraping',
    isNsfw: false,
  },
  {
    name: 'Komikcast',
    baseUrl: 'https://v1.komikcast.fit',
    domains: 'v1.komikcast.fit',
    language: 'Indonesia',
    method: 'Browser Rendering (Playwright)',
    isNsfw: false,
  },
  {
    name: 'Sektedoujin',
    baseUrl: 'https://sektedoujin.cc',
    domains: 'sektedoujin.cc',
    language: 'Indonesia',
    method: 'Browser Rendering (Puppeteer)',
    isNsfw: true,
  },
];

export function Websites() {
  const nsfwEnabled = useNsfwStore(state => state.nsfwEnabled);

  const visibleWebsites = websites.filter(w => !w.isNsfw || nsfwEnabled);

  return (
    <div className="about-page max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-4">Website yang Didukung</h1>
      <p className="text-gray-600 mb-8">
        Berikut adalah daftar website komik yang saat ini didukung
        oleh Cuma Baca:
      </p>

      <section className="mb-12">
        {visibleWebsites.map(site => (
          <div
            key={site.name}
            className="bg-white border border-gray-200 rounded-lg p-6 mb-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-semibold">{site.name}</h2>
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Aktif
              </span>
            </div>
            <div className="space-y-2 text-gray-700">
              <p>
                <strong>Base URL:</strong>{' '}
                <a
                  href={site.baseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {site.baseUrl.replace('https://', '')}
                </a>
              </p>
              <p><strong>Domain:</strong> {site.domains}</p>
              <p><strong>Bahasa:</strong> {site.language}</p>
              <p><strong>Metode:</strong> {site.method}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Cara Menggunakan</h2>
        <ol className="list-decimal list-inside space-y-3 text-gray-700">
          <li>Kunjungi salah satu website yang didukung di atas</li>
          <li>Cari komik yang ingin Anda baca</li>
          <li>Salin URL halaman komik tersebut</li>
          <li>Kembali ke Cuma Baca dan tempel URL ke formulir</li>
          <li>Klik "Kirim" dan nikmati membaca tanpa gangguan!</li>
        </ol>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Catatan Penting</h2>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 text-gray-700 text-sm leading-relaxed">
          <p className="mb-2">
            <strong>Ketersediaan:</strong> Website yang didukung
            dapat berubah sewaktu-waktu tergantung ketersediaan
            dan kebijakan dari website sumber.
          </p>
          <p>
            <strong>Request Website Baru:</strong> Jika Anda
            ingin kami menambahkan website lain, silakan hubungi
            kami atau buat issue di repository GitHub kami.
          </p>
        </div>
      </section>
    </div>
  );
}
