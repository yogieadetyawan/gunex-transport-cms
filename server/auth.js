const express = require('express');
const bcrypt = require('bcryptjs');
const { readUsers, writeUsers, readFleetPin, writeFleetPin } = require('./db');

const router = express.Router();

function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ ok: false, error: 'Belum login.' });
}

// Middleware untuk halaman HTML (bukan API): jika belum login, redirect ke
// halaman portal /admin (tempat form login berada) daripada mengembalikan JSON 401
// yang tidak ada gunanya jika diakses langsung lewat browser/URL bar.
function requireAuthPage(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.redirect('/admin');
}

// Middleware KHUSUS untuk Gunex Fleet: menerima DUA jenis sesi -
// (1) sesi admin penuh (login username+password biasa), ATAU
// (2) sesi terbatas yang dibuat lewat akses cepat PIN (req.session.fleetOnly).
// Sesi PIN HANYA pernah diberi tanda fleetOnly, TIDAK PERNAH diberi isAdmin -
// sehingga walau bisa membuka Gunex Fleet, sesi ini tetap diblokir oleh
// requireAuth/requireAuthPage biasa dari mengakses Company Profile atau
// PO Matcher. Ini sengaja dipisah agar PIN 6-digit (yang jauh lebih mudah
// ditebak dibanding password biasa) tidak pernah jadi jalan pintas ke data
// yang lebih sensitif.
function requireFleetAccess(req, res, next) {
  if (req.session && (req.session.isAdmin || req.session.fleetOnly)) return next();
  return res.status(401).json({ ok: false, error: 'Belum login.' });
}

function requireFleetAccessPage(req, res, next) {
  if (req.session && (req.session.isAdmin || req.session.fleetOnly)) return next();
  return res.redirect('/admin');
}

// --- Rate limiting sederhana untuk login (cegah brute force password) ---
// Disimpan in-memory per-IP: maksimal 8 percobaan gagal per 10 menit,
// setelah itu IP tersebut harus menunggu sebelum bisa mencoba lagi.
// Cukup untuk skala aplikasi ini (1 akun admin); dibersihkan otomatis berkala
// agar tidak membesar tanpa batas (memory leak) pada proses yang berjalan lama.
const LOGIN_MAX_ATTEMPTS = 8;
const LOGIN_WINDOW_MS = 10 * 60 * 1000; // 10 menit
const loginAttempts = new Map(); // ip -> { count, firstAttemptAt }

function getClientIp(req) {
  // Railway/proxy umumnya set X-Forwarded-For; fallback ke req.ip Express.
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry) return { blocked: false };
  if (now - entry.firstAttemptAt > LOGIN_WINDOW_MS) {
    loginAttempts.delete(ip);
    return { blocked: false };
  }
  if (entry.count >= LOGIN_MAX_ATTEMPTS) {
    const retryAfterMs = LOGIN_WINDOW_MS - (now - entry.firstAttemptAt);
    return { blocked: true, retryAfterSec: Math.ceil(retryAfterMs / 1000) };
  }
  return { blocked: false };
}

function recordFailedAttempt(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now - entry.firstAttemptAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAttemptAt: now });
  } else {
    entry.count += 1;
  }
}

function clearAttempts(ip) {
  loginAttempts.delete(ip);
}

// Bersihkan entri kedaluwarsa setiap 30 menit agar Map tidak membesar tanpa batas
// pada proses server yang berjalan lama (mencegah memory leak ringan).
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of loginAttempts.entries()) {
    if (now - entry.firstAttemptAt > LOGIN_WINDOW_MS) loginAttempts.delete(ip);
  }
}, 30 * 60 * 1000);

// Rate limit KHUSUS untuk PIN akses cepat Gunex Fleet - SENGAJA dibuat lebih
// ketat daripada login biasa (5 percobaan per 15 menit, bukan 8 per 10 menit),
// karena PIN 6-digit numerik (1 juta kemungkinan) jauh lebih lemah daripada
// password bebas karakter. Key rate limit ini terpisah dari login biasa
// ('pin:' + ip, bukan ip polos), supaya kedua mekanisme tidak saling memblokir.
const PIN_MAX_ATTEMPTS = 5;
const PIN_WINDOW_MS = 15 * 60 * 1000; // 15 menit
const pinAttempts = new Map();

function checkPinRateLimit(ip) {
  const now = Date.now();
  const entry = pinAttempts.get(ip);
  if (!entry) return { blocked: false };
  if (now - entry.firstAttemptAt > PIN_WINDOW_MS) {
    pinAttempts.delete(ip);
    return { blocked: false };
  }
  if (entry.count >= PIN_MAX_ATTEMPTS) {
    const retryAfterMs = PIN_WINDOW_MS - (now - entry.firstAttemptAt);
    return { blocked: true, retryAfterSec: Math.ceil(retryAfterMs / 1000) };
  }
  return { blocked: false };
}
function recordFailedPinAttempt(ip) {
  const now = Date.now();
  const entry = pinAttempts.get(ip);
  if (!entry || now - entry.firstAttemptAt > PIN_WINDOW_MS) {
    pinAttempts.set(ip, { count: 1, firstAttemptAt: now });
  } else {
    entry.count += 1;
  }
}
function clearPinAttempts(ip) {
  pinAttempts.delete(ip);
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of pinAttempts.entries()) {
    if (now - entry.firstAttemptAt > PIN_WINDOW_MS) pinAttempts.delete(ip);
  }
}, 30 * 60 * 1000);

router.post('/login', (req, res) => {
  const ip = getClientIp(req);
  const rate = checkRateLimit(ip);
  if (rate.blocked) {
    return res.status(429).json({
      ok: false,
      error: `Terlalu banyak percobaan login gagal. Coba lagi dalam ${Math.ceil(rate.retryAfterSec / 60)} menit.`
    });
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ ok: false, error: 'Username dan password wajib diisi.' });
  }
  let user;
  try {
    user = readUsers();
  } catch (e) {
    console.error('Gagal membaca users.json:', e);
    return res.status(500).json({ ok: false, error: 'Gagal membaca data akun di server.' });
  }
  if (!user || user.username !== username) {
    recordFailedAttempt(ip);
    return res.status(401).json({ ok: false, error: 'Username atau password salah.' });
  }
  const match = bcrypt.compareSync(password, user.passwordHash);
  if (!match) {
    recordFailedAttempt(ip);
    return res.status(401).json({ ok: false, error: 'Username atau password salah.' });
  }
  clearAttempts(ip);
  // Regenerasi session ID setelah login berhasil (mencegah session fixation attack —
  // di mana penyerang menetapkan session ID korban sebelum login, lalu memakainya
  // setelah korban berhasil masuk). express-session akan otomatis membuat cookie baru.
  req.session.regenerate((err) => {
    if (err) {
      console.error('Gagal regenerasi session:', err);
      return res.status(500).json({ ok: false, error: 'Terjadi kesalahan saat membuat sesi.' });
    }
    req.session.isAdmin = true;
    req.session.username = username;
    res.json({ ok: true, username });
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get('/me', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.json({ ok: true, loggedIn: true, username: req.session.username, fleetOnly: false });
  }
  if (req.session && req.session.fleetOnly) {
    return res.json({ ok: true, loggedIn: true, fleetOnly: true });
  }
  res.json({ ok: true, loggedIn: false });
});

// Akses cepat ke Gunex Fleet lewat PIN 6-digit, ditampilkan di halaman login
// portal. Sengaja TIDAK memberi req.session.isAdmin = true - sesi ini hanya
// mendapat req.session.fleetOnly, sehingga hanya bisa lewat requireFleetAccess
// (dipakai khusus untuk route Gunex Fleet), tidak bisa membuka Company Profile
// atau PO Matcher walau sesinya valid.
router.get('/fleet-pin-status', (req, res) => {
  const pin = readFleetPin();
  res.json({ ok: true, pinSet: !!pin.pinHash });
});

router.post('/login-pin', (req, res) => {
  const ip = getClientIp(req);
  const rate = checkPinRateLimit(ip);
  if (rate.blocked) {
    return res.status(429).json({
      ok: false,
      error: `Terlalu banyak percobaan PIN salah. Coba lagi dalam ${Math.ceil(rate.retryAfterSec / 60)} menit.`
    });
  }
  const { pin } = req.body || {};
  if (!pin || !/^\d{6}$/.test(String(pin))) {
    return res.status(400).json({ ok: false, error: 'PIN harus 6 digit angka.' });
  }
  const stored = readFleetPin();
  if (!stored.pinHash) {
    return res.status(400).json({ ok: false, error: 'PIN belum diatur. Atur PIN dulu lewat menu Gunex Fleet setelah login biasa.' });
  }
  const match = bcrypt.compareSync(String(pin), stored.pinHash);
  if (!match) {
    recordFailedPinAttempt(ip);
    return res.status(401).json({ ok: false, error: 'PIN salah.' });
  }
  clearPinAttempts(ip);
  req.session.regenerate((err) => {
    if (err) {
      console.error('Gagal regenerasi session untuk PIN:', err);
      return res.status(500).json({ ok: false, error: 'Terjadi kesalahan saat membuat sesi.' });
    }
    req.session.fleetOnly = true;
    res.json({ ok: true });
  });
});

// Mengatur/mengganti PIN - wajib sudah login PENUH (username+password), TIDAK
// bisa diakses lewat sesi fleetOnly sendiri (mencegah seseorang yang hanya
// punya PIN lama untuk mengganti PIN tanpa pernah tahu password admin).
router.post('/set-fleet-pin', requireAuth, (req, res) => {
  const { newPin } = req.body || {};
  if (!newPin || !/^\d{6}$/.test(String(newPin))) {
    return res.status(400).json({ ok: false, error: 'PIN baru harus tepat 6 digit angka.' });
  }
  const pinHash = bcrypt.hashSync(String(newPin), 10);
  writeFleetPin({ pinHash });
  res.json({ ok: true });
});

router.post('/change-password', requireAuth, (req, res) => {
  const ip = getClientIp(req);
  const rate = checkRateLimit('changepass:' + ip);
  if (rate.blocked) {
    return res.status(429).json({
      ok: false,
      error: `Terlalu banyak percobaan gagal. Coba lagi dalam ${Math.ceil(rate.retryAfterSec / 60)} menit.`
    });
  }
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ ok: false, error: 'Password lama dan baru wajib diisi.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ ok: false, error: 'Password baru minimal 6 karakter.' });
  }
  const user = readUsers();
  const match = bcrypt.compareSync(currentPassword, user.passwordHash);
  if (!match) {
    recordFailedAttempt('changepass:' + ip);
    return res.status(401).json({ ok: false, error: 'Password lama salah.' });
  }
  clearAttempts('changepass:' + ip);
  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  writeUsers(user);
  res.json({ ok: true });
});

// Ganti nama pengguna (username) untuk login. Memakai pola yang sama dengan
// change-password: password SAAT INI wajib dimasukkan sebagai konfirmasi
// identitas (mencegah orang yang kebetulan menemukan sesi admin yang masih
// terbuka langsung mengubah username tanpa tahu passwordnya), dan dibatasi
// rate limit terpisah dari percobaan login biasa.
const USERNAME_PATTERN = /^[a-zA-Z0-9_.]{3,32}$/;

router.post('/change-username', requireAuth, (req, res) => {
  const ip = getClientIp(req);
  const rate = checkRateLimit('changeuser:' + ip);
  if (rate.blocked) {
    return res.status(429).json({
      ok: false,
      error: `Terlalu banyak percobaan gagal. Coba lagi dalam ${Math.ceil(rate.retryAfterSec / 60)} menit.`
    });
  }
  const { currentPassword, newUsername } = req.body || {};
  if (!currentPassword || !newUsername) {
    return res.status(400).json({ ok: false, error: 'Password dan nama pengguna baru wajib diisi.' });
  }
  const trimmed = String(newUsername).trim();
  if (!USERNAME_PATTERN.test(trimmed)) {
    return res.status(400).json({
      ok: false,
      error: 'Nama pengguna harus 3-32 karakter, hanya huruf, angka, titik (.), atau garis bawah (_).'
    });
  }
  const user = readUsers();
  const match = bcrypt.compareSync(currentPassword, user.passwordHash);
  if (!match) {
    recordFailedAttempt('changeuser:' + ip);
    return res.status(401).json({ ok: false, error: 'Password salah.' });
  }
  clearAttempts('changeuser:' + ip);
  user.username = trimmed;
  writeUsers(user);
  // Perbarui sesi yang sedang aktif supaya konsisten dengan username baru,
  // tanpa memaksa admin login ulang setelah berhasil mengganti namanya sendiri.
  req.session.username = trimmed;
  res.json({ ok: true, username: trimmed });
});

module.exports = { router, requireAuth, requireAuthPage, requireFleetAccess, requireFleetAccessPage };
