**Flow Backend & Admin — Komik Scraper**

*(Bagian scraper akan dikerjakan belakangan)*

---

### 1. Manajemen Website Sumber

Admin menambahkan **Website** sebagai sumber scraping.

```
Website
- id
- url: string (base URL)
- name: string
```

---

### 2. Scraping Daftar Komik dari Website

Dari setiap website, sistem melakukan scraping untuk mendapatkan daftar komik yang tersedia.

Data yang diambil per komik dari website:
```
KomikWebsite (raw dari scraping)
- judul:    string
- sinopsis: string
- cover:    string (full URL)
- url:      string (URL halaman komik di website tersebut)
```

---

### 3. Sinkronisasi ke Tabel Komik (Deduplication)

Setelah scraping, sistem mengecek apakah komik sudah ada di tabel **Komik** (matching by judul atau identifier lain).

- **Jika sudah ada** → gunakan `id` komik yang existing
- **Jika belum ada** → buat entri baru di tabel Komik terlebih dahulu, lalu ambil `id`-nya

Kemudian simpan relasi komik ↔ website di tabel join:

```
Komik
- id
- judul: string

KomikWebsiteMapping (join table)
- id_komik
- id_website
- url:      string (URL komik di website ini)
- cover:    string
- sinopsis: string
```

> ⚠️ Satu komik bisa berasal dari lebih dari satu website.

---

### 4. Scraping Chapter

Dari `url` di **KomikWebsiteMapping**, sistem scraping daftar chapter:

```
Chapter
- id_komik_website (FK ke KomikWebsiteMapping)
- chapter: number  ← harus bertipe number, bukan string
- url:     string (URL halaman chapter)
```

---

### 5. Scraping Halaman (Pages)

Dari `url` di **Chapter**, sistem scraping daftar halaman:

```
Page
- id_chapter (FK)
- page:  number
- image: string (URL gambar)
```

---

### 6. API untuk Frontend

Endpoint mengembalikan **daftar komik**, di mana setiap komik menyertakan **satu sumber terbaik** — yaitu website yang memiliki **chapter paling baru** (max chapter number).

```
GET /api/komik
→ [
    {
      id, judul, cover, sinopsis,
      sumber: {
        id_website, url_komik,
        latest_chapter: number
      }
    },
    ...
  ]
```

Logika pemilihan sumber: `SELECT website WITH MAX(chapter.chapter) per komik`
