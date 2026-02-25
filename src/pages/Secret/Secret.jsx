import { Link } from 'react-router';
import { NsfwToggle } from './components/NsfwToggle';

export function Secret() {
  return (
    <div className="settings-page max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Mode Konten NSFW</h1>

      <section className="mb-12">
        <NsfwToggle />
      </section>

      <section className="mb-12">
        <h3 className="text-xl font-semibold mb-4">Website dengan Konten NSFW</h3>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full" />
              <strong>Sektedoujin</strong>
              <span className="text-gray-500 text-sm">(sektedoujin.cc)</span>
            </li>
          </ul>
          <p className="text-sm text-gray-600 mt-4">
            Website ini ditandai sebagai NSFW dan hanya akan muncul di daftar
            Website yang Didukung jika mode NSFW diaktifkan.
          </p>
        </div>
      </section>

      <section className="mb-12">
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </section>

      <section className="mb-12">
        <div className="bg-gray-50 border-l-4 border-gray-400 p-4 text-sm text-gray-600">
          <p className="mb-2">
            <strong>Privasi:</strong> Pengaturan NSFW disimpan secara lokal di
            browser Anda menggunakan localStorage. Tidak ada data yang dikirim
            ke server.
          </p>
          <p>
            <strong>Persistence:</strong> Pengaturan akan tetap ada meskipun Anda
            menutup browser atau me-refresh halaman.
          </p>
        </div>
      </section>
    </div>
  );
}
