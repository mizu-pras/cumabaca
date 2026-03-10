# 📖 Design System: cuma baca

**"Cuma mau membaca, tidak mau terganggu."**

Dokumen ini adalah panduan tunggal (Single Source of Truth) untuk antarmuka pengguna (UI) dan pengalaman pengguna (UX) dari platform **cuma baca**. Pendekatan desain kita adalah **"Digital Art Gallery"**: UI bukanlah bintang utamanya, melainkan bingkai tak kasatmata yang menonjolkan karya seni (komik) itu sendiri.

---

## 1. Prinsip Desain (Design Principles)

1. **Nol Distraksi (Zero Distractions):** Tidak ada iklan, pop-up, atau elemen dekoratif yang tidak melayani fungsi membaca.
2. **Konten adalah Raja (Content-First):** Biarkan warna dan detail dari panel komik yang mendominasi layar. 
3. **Bernapas (Whitespace is a Feature):** Jangan takut dengan ruang kosong. Ruang kosong memberi mata tempat untuk beristirahat.
4. **Pergerakan Halus (Fluid Motion):** Navigasi dan *scrolling* harus terasa seperti membalik halaman buku fisik—alami dan tanpa hambatan.

---

## 2. Palet Warna (Color Palette)

Kita menggunakan palet monokromatik ekstrem untuk meminimalisir kelelahan mata (*eye strain*) dan memastikan gambar komik *pop-out*.

### Tema Terang (Light Mode - The Canvas)
* **Background (Primary):** `#FAFAFA` (Off-white / Kertas kanvas) - *Digunakan untuk latar belakang utama.*
* **Surface (Secondary):** `#FFFFFF` (Pure White) - *Untuk kartu, menu overlay.*
* **Text (Primary):** `#1A1A1A` (Ink Black) - *Untuk judul dan teks utama.*
* **Text (Secondary/Muted):** `#737373` (Neutral Gray) - *Untuk sinopsis, metadata, tanggal rilis.*
* **Divider/Border:** `#E5E5E5` (Light Gray) - *Hanya digunakan jika sangat perlu (misal: pembatas chapter).*

### Tema Gelap (Dark Mode - The Cinema)
* **Background (Primary):** `#000000` (OLED Black) - *Meningkatkan baterai dan imersi.*
* **Surface (Secondary):** `#121212` (Dark Charcoal) - *Untuk menu dan overlay agar tidak terlalu kontras.*
* **Text (Primary):** `#F5F5F5` (Soft White) - *Menghindari putih murni yang menyilaukan.*
* **Text (Secondary/Muted):** `#A3A3A3` (Dim Gray).
* **Divider/Border:** `#262626` (Very Dark Gray).

> *Catatan: Tidak ada warna "Aksen" (seperti merah atau biru) secara bawaan. Link atau tombol aktif cukup ditandai dengan ketebalan font (bold) atau perubahan warna antara teks primary/secondary.*

---

## 3. Tipografi (Typography)

Menggabungkan kesan editorial yang elegan (Serif) dengan antarmuka yang modern dan bersih (Sans-Serif).

**1. Font Judul (Display & Headings): `Playfair Display` atau `Lora`**
* *Penggunaan:* Judul komik, nama chapter, quote di halaman "About Us".
* *Karakteristik:* Serif, elegan, bernuansa sastra/galeri.

**2. Font Antarmuka (UI & Body Text): `Inter` atau `SF Pro Display`**
* *Penggunaan:* Navigasi menu, sinopsis, tombol, angka chapter.
* *Karakteristik:* Sans-serif geometris, sangat terbaca di ukuran kecil.

**Hierarki Ukuran (Base: 16px = 1rem):**
* **H1 (Judul Utama Komik):** Serif, 32px (Mobile) / 48px (Desktop), *Medium (500)*.
* **H2 (Judul Section):** Serif, 24px (Mobile) / 32px (Desktop), *Regular (400)*.
* **Body (Teks Sinopsis/About Us):** Sans-serif, 16px, *Regular (400)*, Line-height: 1.6.
* **Caption (Nama Author/Tanggal):** Sans-serif, 14px, *Medium (500)*, Warna: Muted Text.

---

## 4. Sistem Spasi & Grid (Spacing & Layout)

Menggunakan sistem kelipatan 8 (8pt grid system) untuk konsistensi presisi.

* `spacing-xs` : 4px
* `spacing-sm` : 8px
* `spacing-md` : 16px (Padding standar mobile)
* `spacing-lg` : 24px
* `spacing-xl` : 48px (Jarak antar section)
* `spacing-xxl`: 96px (Whitespace besar untuk transisi chapter di kanvas baca)

**Lebar Konten (Max-Width Container):**
* **Teks (About Us/Sinopsis):** Maksimal `680px`. (Agar baris kalimat tidak terlalu panjang dan melelahkan mata).
* **Kanvas Baca (Desktop):** Maksimal `800px` (rata tengah). Latar belakang sisanya mengikuti warna *Background (Primary)*.
* **Kanvas Baca (Mobile):** `100%` (Edge-to-edge), gambar menyentuh ujung layar kiri dan kanan.

---

## 5. Komponen Inti (UI Components)

### A. Tombol (Buttons)
Desain tajam tanpa lengkungan berlebihan (Border-radius: `2px` atau `0px`).
* **Primary Button:** Background kontras tinggi (Hitam di Light Mode, Putih di Dark Mode). Teks tebal. (Contoh: "Mulai Baca").
* **Ghost Button:** Tanpa background, hanya teks, dengan *hover effect* berupa opacity yang menurun (menjadi 70%).

### B. Kartu Komik (Comic Cards - Untuk Home/Jelajah)
* **Gambar (Cover):** Rasio 3:4 atau 2:3. Ujung slightly rounded (`4px`). 
* **Teks:** Judul berada di bawah gambar (H3, Serif). Di bawahnya terdapat teks Author (Caption, Sans-serif).
* **Interaksi:** Tidak ada border. Di desktop, *hover* membesarkan gambar sebesar `1.03x` dengan durasi `300ms ease-out`.

### C. Ikonografi (Iconography)
* Gaya: *Line icon* minimalis (Ketebalan garis: 1.5px).
* Hindari ikon padat (*filled icons*) kecuali untuk menandakan *state* aktif.

---

## 6. Pengalaman Halaman (Page Experiences)

### Halaman Baca (*The Canvas*) - Interaksi Infinity Scroll
Kawasan bebas gangguan. Semua elemen UI disembunyikan saat user mulai men-scroll ke bawah.

* **Pembatas Chapter (Chapter Divider):**
    Saat *infinity scroll* mencapai chapter baru, sajikan dengan elegan:
    
    [Spacing XXL - 96px]
    [Garis Horizontal Tipis - 1px, Lebar 40px, rata tengah]
    [Spacing MD - 16px]
    Teks Serif: "Chapter [X]: [Judul Chapter]"
    [Spacing MD - 16px]
    [Garis Horizontal Tipis - 1px, Lebar 40px, rata tengah]
    [Spacing XXL - 96px]
    [Gambar Komik Chapter Baru Dimulai]
    
* **Overlay Menu (Muncul saat di-tap):**
    * *Top Bar (Transparan blur):* Judul komik (tengah), Tombol Kembali (kiri), Ikon Settings/Display (kanan).
    * *Bottom Bar:* Slider progres vertikal tipis, Angka Chapter/Halaman saat ini.
* **Loading State (Infinity Scroll):**
    Di ujung bawah halaman, hindari ikon *spinner* bulat. Gunakan teks "*Memuat mahakarya berikutnya...*" yang *fade-in* perlahan, atau *skeleton loading* kotak abu-abu redup.

---

## 7. Animasi & Transisi (Motion Guidelines)

* **Kecepatan (Timing):** Cepat namun lembut. Umumnya `200ms - 300ms`.
* **Easing:** `ease-in-out` atau `cubic-bezier(0.4, 0.0, 0.2, 1)`.
* **Perpindahan Halaman:** Terapkan *Fade-in* sederhana. Jangan gunakan animasi bergeser (*slide*) dari kiri/kanan yang agresif.
* **Lazy Loading Gambar:** Gambar komik harus muncul dengan efek *blur-to-sharp* atau *fade-in* lambat (500ms) untuk menghindari gambar "pop-up" secara kasar saat internet lambat.

---

## 8. Aturan Larangan (The "Do Not" List)
1. **Dilarang** menggunakan bayangan (*drop-shadows*) yang tebal. Gunakan *shadow* yang sangat pudar (opacity 5%) jika mutlak diperlukan.
2. **Dilarang** menaruh *floating action button* (FAB) yang selalu terlihat di halaman baca.
3. **Dilarang** ada elemen *sticky* di layar saat mode membaca, selain gambar komik itu sendiri.
