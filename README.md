# Gunex Transport — Company Profile + Admin CMS

Website company profile **PT. Gunex Transport Indonesia** dengan sistem admin
berbasis login untuk mengedit seluruh konten (teks, statistik, daftar layanan,
armada, wilayah, klien, kontak, dll) tanpa perlu mengubah kode.

## Arsitektur

- **Backend**: Node.js + Express
- **Penyimpanan data**: file JSON (`data/content.json`) — tidak perlu instal database terpisah
- **Autentikasi admin**: session + password ter-hash (bcrypt)
- **Frontend publik**: HTML + JS murni, mengambil konten dari API (`/api/content`)
- **Frontend admin**: dashboard editor di `/admin`

Karena konten disimpan di server (bukan di browser), **semua pengunjung akan
melihat hasil edit yang sama** begitu admin menyimpan perubahan.

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
- Panel admin: `http://localhost:3000/admin`

## Login Admin (default)

```
Username : admin
Password : gunex2008admin
```

**Segera ganti password** setelah login pertama lewat menu *Akun Admin* di
sidebar admin panel.

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
│   ├── index.js        # Entry point
│   ├── auth.js         # Login, logout, ganti password
│   ├── content-routes.js  # API CRUD konten + upload gambar
│   └── db.js           # Baca/tulis file JSON
├── public/             # Frontend (publik + admin)
│   ├── index.html      # Halaman publik
│   ├── app.js           # Render konten dinamis dari API
│   ├── styles.css
│   ├── admin.html       # Dashboard admin
│   ├── admin.js
│   ├── admin-styles.css
│   ├── assets/          # Gambar statis (peta, dll)
│   └── uploads/         # Gambar yang diupload lewat admin
├── data/
│   ├── content.json          # Data konten aktif (dibuat otomatis saat pertama jalan)
│   ├── content.default.json  # Cadangan konten bawaan (untuk fitur reset)
│   └── users.json            # Kredensial admin (password ter-hash)
└── package.json
```
