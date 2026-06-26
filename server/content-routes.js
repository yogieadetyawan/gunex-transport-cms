const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { readContent, writeContent, resetContent, readFleetData, writeFleetData, resetFleetData } = require('./db');
const { requireAuth, requireFleetAccess } = require('./auth');
const EMBEDDED_DEFAULT_CONTENT = require('./default-content');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext) ? ext : '.png';
    const name = `img-${Date.now()}-${Math.round(Math.random() * 1e6)}${safeExt}`;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /image\/(png|jpe?g|webp|svg\+xml)/.test(file.mimetype);
    cb(ok ? null : new Error('Format gambar tidak didukung.'), ok);
  }
});

// Helper: true hanya untuk plain object ({...}), false untuk array/null/string/number/dst.
function isPlainObject(val) {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

// Validasi struktur top-level konten: harus punya semua section yang dikenal,
// dan tiap section harus berupa plain object. Ini mencegah penyimpanan struktur
// rusak/parsial yang akan membuat halaman publik gagal render atau jadi kosong.
const REQUIRED_SECTIONS = ['brand', 'hero', 'about', 'services', 'fleet', 'flow', 'coverage', 'clients', 'contact', 'footer'];
function validateFullContent(incoming) {
  if (!isPlainObject(incoming)) return 'Data konten harus berupa objek, bukan ' + (Array.isArray(incoming) ? 'daftar/array' : typeof incoming) + '.';
  for (const key of REQUIRED_SECTIONS) {
    if (!(key in incoming)) return `Bagian "${key}" tidak ada di data yang dikirim.`;
    if (!isPlainObject(incoming[key])) return `Bagian "${key}" harus berupa objek.`;
  }
  return null; // valid
}

// Publik: ambil semua konten
router.get('/content', (req, res) => {
  try {
    const content = readContent();
    res.json({ ok: true, content });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Gagal memuat konten.' });
  }
});

// Admin: simpan seluruh konten (full replace, datang dari editor)
router.put('/content', requireAuth, (req, res) => {
  const incoming = req.body && req.body.content;
  const error = validateFullContent(incoming);
  if (error) {
    return res.status(400).json({ ok: false, error });
  }
  try {
    writeContent(incoming);
    res.json({ ok: true, content: incoming });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Gagal menyimpan konten.' });
  }
});

// Admin: update sebagian section saja, misal { section: "hero", data: {...} }
router.patch('/content/:section', requireAuth, (req, res) => {
  const { section } = req.params;
  const data = req.body && req.body.data;
  if (!isPlainObject(data)) {
    return res.status(400).json({ ok: false, error: 'Data section harus berupa objek, bukan ' + (Array.isArray(data) ? 'daftar/array' : typeof data) + '.' });
  }
  if (!REQUIRED_SECTIONS.includes(section)) {
    return res.status(404).json({ ok: false, error: `Section "${section}" tidak dikenal.` });
  }
  try {
    const content = readContent();
    if (!(section in content)) {
      return res.status(404).json({ ok: false, error: `Section "${section}" tidak ditemukan.` });
    }
    content[section] = data;
    writeContent(content);
    res.json({ ok: true, content });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Gagal menyimpan section.' });
  }
});

// Admin: reset ke konten default
router.post('/content/reset', requireAuth, (req, res) => {
  try {
    const content = resetContent();
    res.json({ ok: true, content });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Gagal mereset konten.' });
  }
});

// Admin: upload gambar (logo, peta, foto klien, dsb) - khusus Company Profile,
// TETAP requireAuth penuh (TIDAK menerima sesi PIN).
router.post('/upload', requireAuth, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ ok: false, error: err.message });
    if (!req.file) return res.status(400).json({ ok: false, error: 'Tidak ada file diunggah.' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ ok: true, url });
  });
});

// Upload foto kendaraan/barcode Pertamina khusus Gunex Fleet - endpoint TERPISAH
// dari /upload di atas (bukan dipakai bersama), supaya middleware-nya bisa
// requireFleetAccess (menerima sesi PIN) tanpa membuka sesi PIN ke endpoint
// upload yang dipakai Company Profile.
router.post('/fleet-upload', requireFleetAccess, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ ok: false, error: err.message });
    if (!req.file) return res.status(400).json({ ok: false, error: 'Tidak ada file diunggah.' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ ok: true, url });
  });
});

// ===== Gunex Fleet: data terpusat (vehicles, services, tireEvents, categories) =====
// Catatan keamanan: berbeda dari /api/content yang memang untuk konsumsi publik,
// data fleet ini adalah data INTERNAL perusahaan (armada, sopir, dsb) — jadi GET
// di sini JUGA mewajibkan login, tidak seperti /api/content yang publik.
// requireFleetAccess (bukan requireAuth biasa) dipakai di GET/PUT/beacon supaya
// sesi PIN akses cepat juga bisa membaca & menyimpan data sehari-hari. Aksi
// destruktif (reset total) TETAP requireAuth penuh - PIN saja tidak cukup
// untuk menghapus seluruh data armada.
const FLEET_REQUIRED_ARRAYS = ['vehicles', 'services', 'tireEvents', 'categories'];
function validateFleetData(incoming) {
  if (!isPlainObject(incoming)) return 'Data armada harus berupa objek, bukan ' + (Array.isArray(incoming) ? 'daftar/array' : typeof incoming) + '.';
  for (const key of FLEET_REQUIRED_ARRAYS) {
    if (!Array.isArray(incoming[key])) return `Bagian "${key}" harus berupa daftar/array.`;
  }
  return null;
}

router.get('/fleet-data', requireFleetAccess, (req, res) => {
  try {
    const data = readFleetData();
    res.json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Gagal memuat data armada.' });
  }
});

router.put('/fleet-data', requireFleetAccess, (req, res) => {
  const incoming = req.body && req.body.data;
  const error = validateFleetData(incoming);
  if (error) {
    return res.status(400).json({ ok: false, error });
  }
  try {
    writeFleetData(incoming);
    res.json({ ok: true, data: incoming });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Gagal menyimpan data armada.' });
  }
});

router.post('/fleet-data/reset', requireAuth, (req, res) => {
  try {
    const data = resetFleetData();
    res.json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Gagal mereset data armada.' });
  }
});

// Endpoint khusus untuk navigator.sendBeacon() — dipanggil dari sisi klien saat
// tab/halaman akan ditutup dan masih ada perubahan yang belum sempat tersinkron
// (lihat flushPendingChangesOnExit di gunex-fleet.html). Beacon mengirim body
// JSON MENTAH (bukan dibungkus {data: ...} seperti PUT biasa, karena dikirim
// sebagai Blob langsung), dan tidak menunggu response — jadi endpoint ini harus
// tetap merespons cepat dan tidak mengandalkan adanya balasan yang dibaca klien.
// Cookie session tetap terkirim normal oleh browser untuk same-origin beacon,
// sehingga requireFleetAccess tetap berfungsi seperti endpoint lain (termasuk
// untuk sesi PIN, supaya perubahan dari sesi PIN juga tidak hilang saat tab
// ditutup mendadak).
router.post('/fleet-data/beacon', requireFleetAccess, (req, res) => {
  const incoming = req.body;
  const error = validateFleetData(incoming);
  if (error) {
    // Beacon tidak baca response, tapi tetap kembalikan status yang benar untuk log server.
    return res.status(400).end();
  }
  try {
    writeFleetData(incoming);
    res.status(204).end();
  } catch (e) {
    console.error('[beacon] Gagal menyimpan data armada darurat:', e);
    res.status(500).end();
  }
});

module.exports = router;
