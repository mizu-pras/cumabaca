export function About() {
  return (
    <div className="about-page max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Tentang Cuma Baca</h1>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">
          Ruang Baca yang Jujur
        </h2>
        <p className="text-slate-700 leading-relaxed">
          Cuma Baca adalah proyek sederhana yang lahir dari
          keinginan untuk membaca komik tanpa gangguan. Kami
          menyadari bahwa terkadang, mencari bab terbaru di
          internet bisa sangat melelahkan karena banyaknya iklan
          dan navigasi yang rumit. Di sini, kami membuang itu
          semua.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">
          Bagaimana Kami Bekerja
        </h2>
        <p className="text-slate-700 leading-relaxed">
          Situs ini beroperasi secara otomatis. Kami menggunakan
          alat khusus untuk mengumpulkan konten yang tersedia
          secara publik di internet dan menyajikannya kembali
          dalam antarmuka yang bersih dan minimalis.
        </p>
        <p className="text-slate-700 leading-relaxed mt-4">
          Kami tidak menyimpan file di server kami sendiri; kami
          menggunakan sistem hotlinking untuk memastikan beban
          server tetap ringan dan akses tetap cepat bagi kamu.
          Fokus kami hanya satu: Memberikan pengalaman membaca
          yang paling nyaman.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">
          Disclaimer & Hak Cipta
        </h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          Transparansi adalah prioritas kami. Perlu diketahui
          bahwa:
        </p>
        <div className="bg-slate-100 border-l-4 border-slate-300 p-4 text-slate-600 text-sm leading-relaxed">
          <p className="mb-2">
            <strong>Disclaimer:</strong> Semua konten (gambar
            dan teks) di situs ini dikumpulkan dari sumber
            publik yang tersedia secara bebas di internet
            melalui alat otomatis. Kami tidak menyimpan file di
            server kami sendiri dan tidak memiliki hak cipta
            atas karya tersebut. Hak cipta sepenuhnya milik
            pengarang, artis, dan penerbit masing-masing.
          </p>
          <p>
            Kami sangat menghargai kerja keras para kreator.
            Jika Anda adalah pemilik sah dari konten yang
            ditampilkan di sini dan ingin konten tersebut
            dihapus atau memiliki keberatan lainnya, silakan
            hubungi kami. Kami akan segera menindaklanjuti
            permintaan Anda.
          </p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">
          Mengapa Tanpa Iklan?
        </h2>
        <p className="text-slate-700 leading-relaxed mb-6">
          Karena kami juga pembaca. Kami percaya bahwa karya seni
          dan cerita yang bagus layak dinikmati tanpa interupsi
          pop-up atau spanduk yang mengganggu pandangan. Situs ini
          adalah bentuk apresiasi kami terhadap dunia komik.
        </p>
        <blockquote className="border-l-4 border-indigo-600 pl-4 italic text-slate-600">
          "Karena setiap garis dan dialog dalam komik layak
          mendapatkan perhatian penuh tanpa gangguan."
        </blockquote>
      </section>
    </div>
  );
}
