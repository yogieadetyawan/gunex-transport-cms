const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { readContent, writeContent, resetContent } = require('./db');
const { requireAuth } = require('./auth');

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
  if (!incoming || typeof incoming !== 'object') {
    return res.status(400).json({ ok: false, error: 'Data konten tidak valid.' });
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
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ ok: false, error: 'Data tidak valid.' });
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

// Admin: upload gambar (logo, peta, foto klien, dsb)
router.post('/upload', requireAuth, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ ok: false, error: err.message });
    if (!req.file) return res.status(400).json({ ok: false, error: 'Tidak ada file diunggah.' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ ok: true, url });
  });
});

module.exports = router;
