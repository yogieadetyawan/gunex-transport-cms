const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const { router: authRouter, requireAuth, requireAuthPage } = require('./auth');
const contentRouter = require('./content-routes');
const { readContent, writeContent, resetContent, CONTENT_FILE } = require('./db');
const EMBEDDED_DEFAULT_CONTENT = require('./default-content');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.SESSION_SECRET) {
  console.warn('[peringatan] SESSION_SECRET belum diset di environment variable. Server tetap berjalan dengan kunci acak, tapi semua sesi login akan ter-reset setiap kali server di-restart/redeploy. Disarankan set SESSION_SECRET di Railway > Variables.');
}

// Railway (dan kebanyakan platform hosting Node.js) menjalankan aplikasi di belakang
// reverse proxy: koneksi browser->Railway memang HTTPS, tapi koneksi proxy->aplikasi
// ini di "dalam" biasanya HTTP biasa. Tanpa baris ini, Express tidak tahu bahwa
// request sebenarnya datang lewat HTTPS, sehingga cookie session dengan `secure: true`
// GAGAL TERSIMPAN sama sekali di browser — akibatnya admin tampak harus login ulang
// terus-menerus setiap pindah halaman, padahal login-nya sendiri sebenarnya berhasil.
// 'trust proxy', 1 artinya percaya header X-Forwarded-* dari 1 lapis proxy di depan kita.
app.set('trust proxy', 1);

// --- Self-healing check ---
// Jika data/content.json sudah ada tapi isinya kosong/rusak (misal karena pernah
// dibuat ulang saat folder data/ sempat ditimpa Volume kosong sebelum perbaikan ini
// di-deploy), tulis ulang otomatis dengan konten lengkap. Ini berjalan SEKALI saat
// server start, dan TIDAK menimpa konten yang sudah pernah diedit dengan benar oleh admin.
function healContentIfEmpty() {
  try {
    const current = readContent();
    const looksEmpty =
      !current ||
      !current.hero ||
      !current.hero.headline ||
      String(current.hero.headline).trim() === '' ||
      !Array.isArray(current.services && current.services.items) ||
      current.services.items.length === 0;

    if (looksEmpty) {
      console.log('[heal] content.json terdeteksi kosong/tidak lengkap. Menulis ulang dengan konten default lengkap...');
      writeContent(EMBEDDED_DEFAULT_CONTENT);
      console.log('[heal] Berhasil. content.json sekarang berisi konten lengkap.');
    } else {
      console.log('[heal] content.json sudah berisi konten yang valid, tidak diubah.');
    }
  } catch (e) {
    console.error('[heal] Gagal memeriksa/menulis content.json:', e);
  }
}
healContentIfEmpty();

// --- Security headers (Helmet) ---
// Helmet dipasang TANPA Content-Security-Policy bawaan di sini (contentSecurityPolicy: false),
// karena kita butuh dua kebijakan CSP yang berbeda untuk dua kelompok halaman:
//   1. Halaman utama (publik, editor company profile) -> CSP ketat, lihat cspStrict di bawah.
//   2. Aplikasi legacy single-file (Gunex Fleet, PO Matcher) -> CSP lebih permisif,
//      karena kedua file ini memakai inline <script>, inline onclick=, dan memuat
//      library dari CDN (jspdf, dst) yang sudah dibangun sebelum proyek ini ada.
//      Mengetatkan CSP di sana akan mematikan total fungsinya. Tetap diberi batas:
//      hanya domain CDN yang benar-benar dipakai yang diizinkan, bukan "allow all".
// Header keamanan LAIN dari Helmet (HSTS, X-Frame-Options, X-Content-Type-Options, dst)
// tetap aktif untuk semua route lewat app.use(helmet(...)) di bawah.
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// CSP ketat: dipakai untuk halaman publik (/) dan editor company profile (/admin, /admin/company-profile).
// - frameAncestors 'self' karena halaman publik SENGAJA dimuat di <iframe> oleh
//   /admin/company-profile untuk fitur pratinjau langsung saat admin mengetik.
// - styleSrc/fontSrc mengizinkan Google Fonts (Oswald/Work Sans/JetBrains Mono).
// - 'unsafe-inline' pada styleSrc hanya membuka inline STYLE (style="..."), BUKAN
//   inline SCRIPT — scriptSrc tetap 'self' sehingga celah XSS lewat <script> tertutup.
const cspStrict = helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    imgSrc: ["'self'", 'data:'],
    connectSrc: ["'self'"],
    frameAncestors: ["'self'"],
    frameSrc: ["'self'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"]
  }
});

// CSP permisif: KHUSUS untuk /admin/gunex-fleet dan /admin/po-matcher (aplikasi legacy
// single-file). Tetap dibatasi ke domain CDN yang benar-benar dipakai (cdnjs.cloudflare.com,
// cdn.jsdelivr.net untuk library jsPDF/dsb), bukan wildcard sembarangan. frameAncestors/
// formAction tetap 'self' karena tidak ada kebutuhan dimuat dari luar atau submit ke luar.
const cspLegacyApps = helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    // 'wasm-unsafe-eval' (BUKAN 'unsafe-eval' biasa) khusus dibutuhkan oleh mesin
    // OCR Tesseract.js di PO Matcher, yang meng-compile modul WebAssembly secara
    // dinamis di browser untuk membaca teks dari PDF. Tanpa ini, OCR gagal total
    // dengan error "Refused to compile or instantiate WebAssembly module" — sudah
    // dikonfirmasi lewat tes nyata (proses PDF macet/error tanpa direktif ini).
    // Ini TIDAK mengizinkan eval() JavaScript biasa, hanya WebAssembly secara khusus.
    scriptSrc: ["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'", 'https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net'],
    scriptSrcAttr: ["'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
    imgSrc: ["'self'", 'data:', 'blob:'],
    workerSrc: ["'self'", 'blob:'],
    connectSrc: ["'self'", 'blob:'],
    frameAncestors: ["'self'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"]
  }
});

app.use(express.json({ limit: '2mb' }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 8 // 8 jam
  }
}));

app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));
app.use('/assets', express.static(path.join(__dirname, '..', 'public', 'assets')));
app.use(express.static(path.join(__dirname, '..', 'public'), { index: false }));

app.use('/api/auth', authRouter);
app.use('/api', contentRouter);

// --- Portal admin & aplikasi internal ---
// /admin            -> portal menu (berisi form login jika belum masuk)
// /admin/company-profile -> editor company profile (aplikasi yang sudah ada sebelumnya)
// /admin/gunex-fleet      -> aplikasi pendataan armada (standalone, single-file)
// /admin/po-matcher       -> aplikasi pencocokan PO vs tagihan (standalone, single-file)
// Ketiga aplikasi terakhir dilindungi requireAuthPage: jika belum login, browser
// akan diarahkan balik ke /admin (bukan diberi error JSON, karena ini diakses
// langsung lewat URL/browser, bukan lewat fetch()).
app.get('/admin', cspStrict, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

app.get('/admin/company-profile', cspStrict, requireAuthPage, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin-company-profile.html'));
});

app.get('/admin/gunex-fleet', cspLegacyApps, requireAuthPage, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'protected-apps', 'gunex-fleet.html'));
});

app.get('/admin/po-matcher', cspLegacyApps, requireAuthPage, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'protected-apps', 'po-matcher.html'));
});

app.get('/', cspStrict, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('*', cspStrict, (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ ok: false, error: 'Not found' });
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Gunex Transport CMS berjalan di http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});
