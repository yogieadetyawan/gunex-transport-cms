const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const { router: authRouter } = require('./auth');
const contentRouter = require('./content-routes');
const { readContent, writeContent, resetContent, CONTENT_FILE } = require('./db');
const EMBEDDED_DEFAULT_CONTENT = require('./default-content');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.SESSION_SECRET) {
  console.warn('[peringatan] SESSION_SECRET belum diset di environment variable. Server tetap berjalan dengan kunci acak, tapi semua sesi login akan ter-reset setiap kali server di-restart/redeploy. Disarankan set SESSION_SECRET di Railway > Variables.');
}

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
// Catatan konfigurasi penting (jangan dihapus sembarangan, ini sengaja disesuaikan):
// - frameAncestors 'self' (bukan default yang lebih ketat) karena halaman publik (/)
//   SENGAJA dimuat di dalam <iframe> oleh /admin untuk fitur pratinjau langsung saat
//   admin mengetik. Tanpa pengecualian ini, fitur pratinjau akan gagal total karena
//   browser memblokir iframe lintas-konteks meskipun masih origin yang sama.
// - styleSrc/fontSrc mengizinkan Google Fonts karena halaman publik & admin memuat
//   font Oswald/Work Sans/JetBrains Mono dari fonts.googleapis.com & fonts.gstatic.com.
// - 'unsafe-inline' pada styleSrc dibutuhkan karena banyak elemen pakai inline style
//   (style="...") untuk layout dinamis; ini hanya membuka inline STYLE, bukan inline
//   SCRIPT, jadi tidak membuka celah XSS lewat <script> karena scriptSrc tetap 'self'.
app.use(helmet({
  contentSecurityPolicy: {
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
  },
  crossOriginEmbedderPolicy: false // dimatikan agar tidak memblokir iframe pratinjau & Google Fonts
}));

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

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ ok: false, error: 'Not found' });
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Gunex Transport CMS berjalan di http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});
