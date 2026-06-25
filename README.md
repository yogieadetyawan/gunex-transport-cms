# Gunex Transport — Portal Admin Internal

Portal admin terpadu untuk **PT. Gunex Transport Indonesia**, berisi tiga
aplikasi yang bisa diakses setelah login satu kali:

1. **Kelola Isi Company Profile** — edit teks, statistik, layanan, armada,
   wilayah, klien, dan kontak yang tampil di website perusahaan.
2. **Gunex Fleet** — pencatatan service, ban, pajak/KIR, oli, sopir, dan foto
   kendaraan untuk seluruh armada.
3. **PO Matcher** — pencocokan nomor surat jalan dari PO (PDF) dengan data
   tagihan Excel secara otomatis (OCR berjalan offline di browser).

## Arsitektur

- **Backend**: Node.js + Express
- **Penyimpanan data company profile**: file JSON (`data/content.json`) — tidak perlu instal database terpisah
- **Penyimpanan data Gunex Fleet**: juga tersimpan terpusat di server (`data/fleet.json`)
  — sama seperti company profile, semua data armada (kendaraan, riwayat
  service, riwayat ban, kategori) bisa diakses dan diedit dari perangkat
  manapun setelah login. Ada beberapa lapis perlindungan supaya perubahan
  tidak pernah hilang, walau dalam kondisi tidak ideal sekalipun:
  - Setiap perubahan langsung tersimpan ke perangkat (localStorage) secara
    instan, baru dikirim ke server sepersekian detik kemudian.
  - Jika tab/aplikasi ditutup tepat di saat pengiriman ke server belum
    selesai, browser tetap memaksa mengirim sisa perubahan tersebut lewat
    mekanisme khusus (`navigator.sendBeacon`) yang dirancang untuk situasi
    ini, dibantu juga oleh pemicu tambahan saat aplikasi diminimalkan/pindah
    tab supaya kesempatan menyimpan lebih sering muncul.
  - Jika koneksi internet putus sepenuhnya saat menyimpan, aplikasi otomatis
    mencoba lagi setiap beberapa detik sampai berhasil, dan memberi tanda
    jelas di layar bahwa ada perubahan yang belum tersimpan ke server.
  - Setiap kali aplikasi dibuka, ia memeriksa lebih dulu apakah ada
    perubahan di perangkat itu yang ternyata belum pernah berhasil
    tersimpan ke server (misalnya karena mati listrik/baterai habis saat
    sedang menyimpan) — jika ada, perubahan itu akan dicoba disimpan dulu
    sebelum memuat data lainnya, supaya tidak ada yang tertimpa atau hilang.
- **PO Matcher**: TIDAK memiliki data yang disimpan permanen — aplikasi ini
  murni alat olah file (upload PDF + Excel → proses → unduh hasil), sehingga
  tidak ada yang perlu dipusatkan. Setiap kali dipakai, prosesnya dari awal
  lagi dengan file baru.
- **Autentikasi**: satu login admin (session + password ter-hash bcrypt)
  berlaku untuk akses ke ketiga aplikasi.
- **Frontend publik (website company profile)**: HTML + JS murni, mengambil
  konten dari API (`/api/content`)
- **Frontend admin**: portal menu di `/admin`, lalu masing-masing aplikasi di
  `/admin/company-profile`, `/admin/gunex-fleet`, `/admin/po-matcher`

Karena konten company profile dan data Gunex Fleet disimpan di server (bukan
hanya di browser), **semua pengunjung/pengguna akan melihat hasil edit yang
sama** begitu disimpan, dari perangkat manapun.

## Menjalankan di komputer/server sendiri

Pastikan [Node.js](https://nodejs.org) versi 18 atau lebih baru sudah terpasang.

```bash
# 1. Masuk ke folder proyek
cd gunex-app

# 2. Install dependency
npm install

# 3. Jalankan server
npm start
```

Setelah berjalan:
- Website publik: `http://localhost:3000`
- Portal admin: `http://localhost:3000/admin`

## Login Admin (default)

```
Username : admin
Password : gunex2008admin
```

**Segera ganti password** setelah login pertama lewat menu *Kata Sandi* di
sidebar aplikasi "Kelola Isi Company Profile".

## Apa yang bisa diedit lewat Admin Panel

| Menu | Yang bisa diubah |
|---|---|
| Hero / Beranda | Judul, deskripsi, teks tombol, 4 kotak statistik |
| Tentang Kami | Judul, paragraf cerita perusahaan, tabel profil singkat |
| Layanan | Tambah/hapus/edit daftar layanan |
| Armada | Tambah/hapus/edit tipe kendaraan, total unit |
| Alur Kerja Sama | Tambah/hapus/edit langkah-langkah onboarding |
| Wilayah Layanan | Tambah/hapus wilayah, atur posisi pin di peta (dalam %) |
| Klien | Tambah/hapus daftar nama klien |
| Kontak | Alamat, telepon, email, jam operasional |
| Footer | Teks copyright |
| Akun Admin | Ganti password |

Tombol **"Reset ke Default"** mengembalikan semua isi ke konten bawaan jika
diperlukan (tindakan ini tidak bisa dibatalkan).

## Mengganti posisi pin di peta wilayah

Pin pada peta Pulau Jawa diatur lewat koordinat **persen (%)** posisi
horizontal (X) dan vertikal (Y) relatif terhadap gambar peta. Admin bisa
mengubah nilai ini di menu *Wilayah Layanan*, simpan, lalu cek hasilnya
langsung di halaman publik.

## Mengganti gambar peta atau logo

Saat ini gambar peta disimpan di `public/assets/java-map.png`. Untuk
menggantinya, timpa file tersebut dengan gambar baru berukuran serupa
(disarankan rasio lebar:tinggi sekitar 768:263), lalu refresh halaman.

Endpoint upload gambar (`POST /api/upload`, butuh login admin) juga tersedia
bila ingin dikembangkan lebih lanjut menjadi fitur "ganti logo/gambar" di
dashboard.

## Catatan soal warning "MemoryStore is not designed for production"

Saat server start, mungkin muncul warning seperti ini di log:

```
Warning: connect.session() MemoryStore is not
designed for a production environment...
```

**Ini bukan error dan bisa diabaikan** untuk skala penggunaan website ini
(1 admin, traffic tidak tinggi). Warning ini hanya relevan jika ada ribuan
pengguna aktif bersamaan, yang butuh session store eksternal seperti Redis.
Untuk company profile dengan 1 akun admin, ini aman digunakan apa adanya.

## Deploy ke hosting

Aplikasi ini adalah aplikasi **Node.js**, bukan file HTML statis biasa —
jadi tidak bisa diupload ke shared hosting yang hanya menerima file HTML.
Pilihan yang cocok:

- **Railway / Render / Fly.io** — upload folder ini sebagai proyek Node.js, jalankan `npm start`
- **VPS (DigitalOcean, dsb)** — install Node.js, copy folder, jalankan dengan `pm2` atau `systemd` agar tetap hidup setelah server restart
- Pastikan environment variable `PORT` disesuaikan jika hosting mewajibkan port tertentu

### Variabel environment

```
PORT=3000                  # port server (default 3000)
SESSION_SECRET=teks-acak   # WAJIB diisi manual saat produksi, lihat penjelasan di bawah
```

**Tentang `SESSION_SECRET` — penting untuk keamanan:**
Jika variabel ini tidak diset, server akan tetap berjalan dengan kunci acak
otomatis, tapi kunci itu **berubah setiap kali server di-restart atau
di-redeploy** — artinya semua orang yang sedang login akan otomatis
ter-logout setiap deploy ulang. Untuk produksi (termasuk di Railway), set
nilai ini secara manual:

1. Buat teks acak yang panjang dan sulit ditebak (minimal 32 karakter), contoh
   cara membuatnya di terminal: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Di Railway: buka service → tab **Variables** → tambahkan `SESSION_SECRET` dengan nilai tersebut.
3. Jangan bagikan nilai ini ke siapa pun atau commit ke GitHub.

## Keamanan

Aplikasi ini sudah dilengkapi sejumlah perlindungan dasar:

- **Password** disimpan ter-hash dengan bcrypt, tidak pernah dalam bentuk teks asli.
- **Rate limiting login**: maksimal 8 percobaan gagal per 10 menit per alamat
  IP, mencegah serangan brute-force/coba-coba password otomatis.
- **Validasi struktur data ketat** pada API penyimpanan konten — mencegah
  data yang rusak atau tidak lengkap tersimpan dan merusak tampilan publik.
- **HTTP security headers** (lewat Helmet): Content-Security-Policy,
  Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options, dan
  beberapa lainnya — sudah disesuaikan agar tidak mengganggu fitur pratinjau
  langsung di admin panel.
- **Proteksi XSS**: semua teks yang diisi admin di-escape sebelum ditampilkan
  ke publik, sehingga karakter seperti `<script>` tidak akan pernah
  dieksekusi sebagai kode oleh browser pengunjung.
- **Session aman**: cookie sesi memakai `httpOnly` (tidak bisa diakses lewat
  JavaScript) dan `sameSite=lax` (proteksi dasar dari CSRF), serta
  di-regenerasi setiap login berhasil (mencegah session fixation).
- **Validasi upload gambar**: hanya menerima file berformat gambar
  (PNG/JPG/WEBP/SVG), maksimal 5MB.

Jika ada yang ingin melaporkan temuan keamanan, silakan tinjau langsung kode
di folder `server/` — semuanya open dan bisa diaudit ulang sewaktu-waktu.

## Struktur folder

```
gunex-app/
├── server/             # Backend Express
│   ├── index.js        # Entry point, routing portal & semua aplikasi
│   ├── auth.js         # Login, logout, ganti password, rate limiting
│   ├── content-routes.js  # API CRUD konten company profile + upload gambar
│   ├── db.js           # Baca/tulis file JSON
│   └── default-content.js # Konten default yang ditanam di kode (cadangan)
├── public/             # Frontend yang BISA diakses langsung (statis)
│   ├── index.html      # Halaman publik (website company profile)
│   ├── app.js, styles.css
│   ├── admin.html      # Portal menu admin (login + 3 kartu pilihan aplikasi)
│   ├── admin.js, admin.css
│   ├── admin-company-profile.html  # Editor company profile (live preview)
│   ├── admin-company-profile.js, admin-company-profile.css
│   ├── assets/          # Gambar statis (peta, dll)
│   └── uploads/         # Gambar yang diupload lewat admin
├── protected-apps/      # Aplikasi yang TIDAK BOLEH diakses langsung tanpa
│   │                    # login — sengaja ditaruh di LUAR folder public/ agar
│   │                    # tidak otomatis disajikan oleh static file server.
│   │                    # Hanya bisa dibuka lewat /admin/gunex-fleet dan
│   │                    # /admin/po-matcher yang diperiksa session loginnya.
│   ├── gunex-fleet.html # Aplikasi pendataan armada (data terpusat di server)
│   └── po-matcher.html  # Aplikasi pencocokan PO vs tagihan (tanpa data tersimpan)
├── data/
│   ├── content.json          # Data konten company profile aktif (otomatis dibuat)
│   ├── content.default.json  # Cadangan konten bawaan (untuk fitur reset)
│   ├── fleet.json            # Data armada aktif: kendaraan, service, ban, kategori
│   ├── fleet.default.json    # Cadangan struktur kosong (untuk fitur reset)
│   └── users.json            # Kredensial admin (password ter-hash)
└── package.json
```

## Catatan tentang dua aplikasi tambahan (Gunex Fleet & PO Matcher)

Kedua aplikasi ini dibangun sebelumnya sebagai file HTML tunggal yang berdiri
sendiri. Saat digabung ke portal ini:

- **Tampilan dan cara pakainya tidak diubah sama sekali** — semua fitur,
  tombol, dan alur kerja tetap sama seperti sebelumnya.
- **Gunex Fleet** sekarang menyimpan datanya (kendaraan, riwayat service,
  riwayat ban, kategori) lewat API ke server (`/api/fleet-data`), bukan lagi
  hanya di `localStorage` browser. Foto kendaraan & barcode Pertamina diunggah
  ke server lewat endpoint upload yang sama dengan company profile, sehingga
  data JSON tetap ringan meskipun banyak foto. Lihat bagian "Arsitektur" di
  atas untuk penjelasan lengkap soal lapisan-lapisan yang memastikan tidak
  ada perubahan yang hilang, termasuk saat koneksi putus atau aplikasi
  ditutup mendadak.
- **PO Matcher** tidak diubah — aplikasi ini murni alat olah file sekali
  pakai (PDF + Excel masuk, hasil cocokan keluar), tidak ada data yang perlu
  atau bisa dipusatkan.
- Ditambahkan: tombol "kembali ke menu" di pojok kiri atas kedua aplikasi,
  dan kebijakan keamanan browser (CSP) yang disesuaikan supaya skrip dan
  library CDN yang dipakai (jsPDF, dsb) tetap berfungsi seperti semula.
