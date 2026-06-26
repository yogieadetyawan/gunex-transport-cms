// File ini berisi SALINAN konten default yang ditanam langsung di kode (bukan dibaca dari file).
// Tujuannya: jika folder data/ kosong/hilang (misal karena Volume Railway menimpa folder data
// saat pertama kali dipasang), server tetap punya konten lengkap untuk di-seed ulang,
// bukan jatuh ke konten kosong.
// Sumber aslinya: data/content.default.json — kalau mau ubah konten default, ubah DI SINI.

const EMBEDDED_DEFAULT_CONTENT = {
  "brand": {
    "companyName": "PT. Gunex Transport Indonesia",
    "shortName": "GUNEX TRANSPORT",
    "tagline": "PT. Gunex Transport Indonesia — Beroperasi sejak 2008"
  },
  "hero": {
    "eyebrow": "PT. Gunex Transport Indonesia — Beroperasi sejak 2008",
    "headline": "Mitra Logistik Darat yang Bergerak Mengikuti",
    "headlineAccent": "Ritme Bisnis Anda",
    "lead": "Kami menjalankan rantai distribusi B2B untuk perusahaan manufaktur, distribusi, dan ritel skala besar — dari gudang hingga titik penerimaan, dengan armada terkelola dan jadwal yang dapat diandalkan setiap hari.",
    "ctaPrimary": "Ajukan Kerja Sama",
    "ctaSecondary": "Lihat Armada Kami",
    "stats": [
      {
        "num": "50+",
        "label": "Unit Armada Aktif"
      },
      {
        "num": "2008",
        "label": "Tahun Berdiri"
      },
      {
        "num": "7",
        "label": "Klien Korporasi Tetap"
      },
      {
        "num": "4",
        "label": "Wilayah Layanan Utama"
      }
    ]
  },
  "about": {
    "kicker": "KM 01 — Tentang Kami",
    "headline": "Dibangun dari Jalan, Bukan dari Brosur",
    "lede": "Sejak 2008, PT. Gunex Transport Indonesia menjalankan satu fokus yang sama: mengantarkan barang milik perusahaan, tepat waktu, dengan proses yang bisa dipertanggungjawabkan.",
    "paragraphs": [
      "PT. Gunex Transport Indonesia berdiri pada tahun 2008 sebagai penyedia jasa ekspedisi darat yang melayani kebutuhan distribusi barang antar wilayah. Berbeda dengan jasa kurir retail, kami memilih untuk fokus sepenuhnya pada segmen B2B (business-to-business) — bermitra langsung dengan perusahaan manufaktur, distributor, dan pelaku usaha berskala besar yang membutuhkan pengiriman volume tinggi secara rutin dan terjadwal.",
      "Selama lebih dari satu dekade, kami berkembang bukan dengan memperbanyak jenis layanan, melainkan dengan memperdalam keandalan: armada yang terawat, sopir yang berpengalaman pada rute yang sama berulang kali, serta koordinasi pengiriman yang disesuaikan dengan siklus operasional masing-masing klien.",
      "Hari ini, Gunex Transport dipercaya oleh tujuh perusahaan korporasi sebagai mitra distribusi tetap, dengan total 50 unit armada yang beroperasi setiap hari menjangkau Jabodetabek, Banten, Jawa Barat, dan Jawa Tengah."
    ],
    "profile": [
      {
        "label": "Nama Perusahaan",
        "value": "PT. Gunex Transport Indonesia"
      },
      {
        "label": "Bidang Usaha",
        "value": "Jasa Ekspedisi B2B"
      },
      {
        "label": "Tahun Berdiri",
        "value": "2008"
      },
      {
        "label": "Segmen",
        "value": "Business to Business"
      },
      {
        "label": "Total Armada",
        "value": "50 Unit"
      },
      {
        "label": "Jenis Armada",
        "value": "4 Tipe"
      },
      {
        "label": "Wilayah Layanan",
        "value": "4 Provinsi"
      },
      {
        "label": "Klien Tetap",
        "value": "7 Perusahaan"
      }
    ]
  },
  "services": {
    "kicker": "KM 02 — Layanan & Keunggulan",
    "headline": "Jasa Ekspedisi yang Dirancang untuk Skala Korporasi",
    "lede": "Kami tidak melayani pengiriman satuan. Setiap layanan kami dirancang untuk mendukung arus distribusi perusahaan yang berjalan setiap hari, dalam volume besar, dan terikat oleh tenggat waktu operasional klien.",
    "items": [
      {
        "title": "Ekspedisi Darat B2B",
        "desc": "Layanan angkutan barang khusus untuk kebutuhan antar-perusahaan, mulai dari gudang produsen hingga gudang distributor atau ritel mitra."
      },
      {
        "title": "Pengiriman Terjadwal",
        "desc": "Rute dan jam keberangkatan disesuaikan dengan siklus produksi dan distribusi klien, sehingga pengiriman dapat diprediksi setiap minggunya."
      },
      {
        "title": "Pengelolaan Armada Terpusat",
        "desc": "50 unit kendaraan dikelola dalam satu sistem operasional, memungkinkan rotasi armada yang efisien dan minim downtime."
      },
      {
        "title": "Koordinasi & Pelacakan Kiriman",
        "desc": "Tim operasional kami memantau setiap perjalanan dan menjadi titik kontak langsung bagi tim logistik klien untuk update status barang."
      },
      {
        "title": "Penyesuaian Kapasitas Muatan",
        "desc": "Empat tipe armada dengan kapasitas berbeda memungkinkan kami menyesuaikan unit dengan volume dan dimensi muatan klien."
      },
      {
        "title": "Keandalan Jangka Panjang",
        "desc": "Hubungan kerja sama dengan klien kami umumnya berjalan multi-tahun, dibangun atas konsistensi, bukan kontrak jangka pendek."
      }
    ]
  },
  "fleet": {
    "kicker": "KM 03 — Armada Kami",
    "headline": "Empat Tipe Kendaraan, Satu Standar Perawatan",
    "lede": "Setiap unit dipilih berdasarkan fungsi muatan, bukan sekadar jumlah. Kombinasi armada ini memungkinkan kami melayani berbagai karakteristik barang klien B2B kami.",
    "items": [
      {
        "name": "CDD Standard",
        "desc": "Truk colt diesel double dengan dimensi compact, ideal untuk distribusi rute padat dan akses ke area gudang/toko dengan ruang manuver terbatas.",
        "tag": "BOX TERTUTUP"
      },
      {
        "name": "CDD Long",
        "desc": "Versi bak panjang dari CDD, menampung volume muatan lebih besar untuk pengiriman dengan kubikasi tinggi namun bobot menengah.",
        "tag": "BOX PANJANG"
      },
      {
        "name": "Fuso Bak",
        "desc": "Truk bermuatan besar dengan bak terbuka, digunakan untuk barang dengan dimensi besar atau yang tidak memerlukan perlindungan penuh dari box tertutup.",
        "tag": "BAK TERBUKA"
      },
      {
        "name": "Fuso Losbak",
        "desc": "Kapasitas terbesar dalam armada kami, dirancang untuk muatan curah dan volume besar pada rute jarak menengah hingga jauh antar provinsi.",
        "tag": "KAPASITAS BESAR"
      }
    ],
    "totalUnit": "50"
  },
  "flow": {
    "kicker": "KM 04 — Alur Kerja Sama",
    "headline": "Bagaimana Kami Mulai Bekerja Sama dengan Klien Baru",
    "lede": "Proses onboarding kami dirancang singkat dan jelas, karena klien B2B kami membutuhkan kepastian, bukan birokrasi panjang.",
    "steps": [
      {
        "title": "Konsultasi Kebutuhan",
        "desc": "Kami memetakan volume, rute, jenis barang, dan frekuensi pengiriman yang dibutuhkan operasional klien."
      },
      {
        "title": "Penjadwalan Armada",
        "desc": "Tim kami menentukan tipe dan jumlah unit yang sesuai, lalu menyusun jadwal pengiriman rutin."
      },
      {
        "title": "Pengiriman Berjalan",
        "desc": "Armada beroperasi sesuai jadwal, dengan koordinasi aktif antara sopir, tim operasional, dan kontak klien."
      },
      {
        "title": "Evaluasi & Penyesuaian",
        "desc": "Performa pengiriman dievaluasi berkala untuk menyesuaikan kapasitas armada dengan pertumbuhan kebutuhan klien."
      }
    ]
  },
  "coverage": {
    "kicker": "KM 05 — Wilayah Layanan",
    "headline": "Menjangkau Empat Wilayah Distribusi Utama Jawa",
    "lede": "Jaringan rute kami difokuskan pada koridor industri dan distribusi terpadat di Jawa, sehingga frekuensi pengiriman dapat tetap tinggi tanpa mengorbankan ketepatan waktu.",
    "areas": [
      {
        "name": "Jabodetabek",
        "desc": "Jakarta, Bogor, Depok, Tangerang, Bekasi",
        "mapX": 19.41,
        "mapY": 23.4,
        "labelPos": "above"
      },
      {
        "name": "Banten",
        "desc": "Termasuk koridor industri Tangerang & Cilegon",
        "mapX": 12.01,
        "mapY": 25.3,
        "labelPos": "below"
      },
      {
        "name": "Jawa Barat",
        "desc": "Bandung Raya dan kawasan industri sekitarnya",
        "mapX": 31.9,
        "mapY": 51.3,
        "labelPos": "below"
      },
      {
        "name": "Jawa Tengah",
        "desc": "Rute distribusi jarak menengah-jauh ke kawasan industri Jateng",
        "mapX": 54.69,
        "mapY": 41.8,
        "labelPos": "above"
      }
    ]
  },
  "clients": {
    "kicker": "KM 06 — Klien Kami",
    "headline": "Dipercaya oleh Perusahaan yang Bergerak Cepat",
    "lede": "Kami mengukur keberhasilan bukan dari jumlah klien, tetapi dari lamanya mereka tetap bersama kami. Berikut perusahaan yang menggunakan jasa distribusi Gunex Transport secara berkelanjutan.",
    "items": [
      "PT. Satyamitra Kemas Lestari Tbk",
      "PT. Purbayasa Putra Perkasa",
      "PT. Bilca Markin Jaya Makmur",
      "PT. Dwi Global Megabox",
      "JNT Cargo Express",
      "PT. Alpha Cikupa Makmur",
      "PT. Gelota Sentral Jaya"
    ]
  },
  "contact": {
    "kicker": "KM 07 — Hubungi Kami",
    "headline": "Mari Bicarakan Kebutuhan Distribusi Perusahaan Anda",
    "lede": "Tim kami siap membantu memetakan rute, kapasitas, dan jadwal armada yang paling sesuai dengan skala operasional bisnis Anda.",
    "address": "Kab. Tangerang, Banten, Indonesia",
    "phone": "(isi nomor kontak operasional Anda)",
    "email": "(isi alamat email perusahaan)",
    "hours": "Senin – Sabtu, 08.00 – 17.00 WIB"
  },
  "footer": {
    "text": "© 2008–2026 PT. Gunex Transport Indonesia. Mitra logistik darat B2B sejak 2008."
  }
};

module.exports = EMBEDDED_DEFAULT_CONTENT;
