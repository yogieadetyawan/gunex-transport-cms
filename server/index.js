const express = require('express');
const session = require('express-session');
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

app.use(express.json({ limit: '2mb' }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
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
