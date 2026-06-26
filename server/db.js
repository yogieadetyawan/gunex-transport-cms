const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const EMBEDDED_DEFAULT_CONTENT = require('./default-content');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const DEFAULT_FILE = path.join(DATA_DIR, 'content.default.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const FLEET_FILE = path.join(DATA_DIR, 'fleet.json');
const FLEET_DEFAULT_FILE = path.join(DATA_DIR, 'fleet.default.json');
const FLEET_PIN_FILE = path.join(DATA_DIR, 'fleet-pin.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');

const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'gunex2008admin';
const EMPTY_FLEET_DATA = { vehicles: [], services: [], tireEvents: [], categories: [] };

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Ambil JSON konten default: prioritas dari file data/content.default.json jika ada
// (memungkinkan admin menimpa "default" sendiri di masa depan), tapi jika file itu
// tidak ada/hilang (misal folder data/ ditimpa Volume kosong), pakai konten lengkap
// yang sudah ditanam langsung di kode (server/default-content.js) sebagai jaminan.
function getDefaultContentRaw() {
  if (fs.existsSync(DEFAULT_FILE)) {
    try {
      return fs.readFileSync(DEFAULT_FILE, 'utf-8');
    } catch (e) {
      // lanjut ke fallback di bawah
    }
  }
  return JSON.stringify(EMBEDDED_DEFAULT_CONTENT, null, 2);
}

function ensureContentFile() {
  ensureDataDir();
  if (!fs.existsSync(CONTENT_FILE)) {
    fs.writeFileSync(CONTENT_FILE, getDefaultContentRaw(), 'utf-8');
  }
}

function ensureUsersFile() {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) {
    const seed = {
      username: DEFAULT_USERNAME,
      passwordHash: bcrypt.hashSync(DEFAULT_PASSWORD, 10)
    };
    fs.writeFileSync(USERS_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    console.log('[seed] users.json tidak ditemukan, dibuat ulang dengan akun default:', DEFAULT_USERNAME);
  }
}

function readContent() {
  ensureContentFile();
  try {
    const raw = fs.readFileSync(CONTENT_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    // File ada tapi isinya korup/tidak valid (misal proses lain menulis setengah jalan,
    // atau penyimpanan diganggu di tengah operasi). Daripada membuat seluruh halaman
    // publik error 500, kembalikan konten default dari memori SEKALIGUS perbaiki file
    // di disk supaya kunjungan berikutnya juga sudah sehat tanpa perlu restart server.
    console.error('[content] Gagal membaca content.json (file korup), memulihkan ke konten default:', e.message);
    const raw = getDefaultContentRaw();
    try {
      fs.writeFileSync(CONTENT_FILE, raw, 'utf-8');
    } catch (writeErr) {
      console.error('[content] Gagal menulis ulang content.json saat pemulihan:', writeErr.message);
    }
    return JSON.parse(raw);
  }
}

function writeContent(obj) {
  ensureDataDir();
  const tmp = CONTENT_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf-8');
  fs.renameSync(tmp, CONTENT_FILE);
}

function resetContent() {
  ensureDataDir();
  const raw = getDefaultContentRaw();
  fs.writeFileSync(CONTENT_FILE, raw, 'utf-8');
  return JSON.parse(raw);
}

function readUsers() {
  ensureUsersFile();
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

function writeUsers(obj) {
  ensureDataDir();
  const tmp = USERS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf-8');
  fs.renameSync(tmp, USERS_FILE);
}

// --- Gunex Fleet data (vehicles, services, tireEvents, categories) ---
// Foto kendaraan TIDAK disimpan di sini sebagai base64 (akan membuat file ini
// membesar tanpa batas). Foto disimpan sebagai file gambar terpisah lewat
// endpoint upload yang sama dengan company profile (lihat content-routes.js),
// dan field di sini hanya menyimpan URL/path-nya saja (string singkat).
function getDefaultFleetRaw() {
  if (fs.existsSync(FLEET_DEFAULT_FILE)) {
    try {
      return fs.readFileSync(FLEET_DEFAULT_FILE, 'utf-8');
    } catch (e) {
      // lanjut ke fallback di bawah
    }
  }
  return JSON.stringify(EMPTY_FLEET_DATA, null, 2);
}

function ensureFleetFile() {
  ensureDataDir();
  if (!fs.existsSync(FLEET_FILE)) {
    fs.writeFileSync(FLEET_FILE, getDefaultFleetRaw(), 'utf-8');
  }
}

function readFleetData() {
  ensureFleetFile();
  try {
    return JSON.parse(fs.readFileSync(FLEET_FILE, 'utf-8'));
  } catch (e) {
    // file rusak/korup -> kembalikan struktur kosong yang valid daripada crash
    console.error('[fleet] Gagal membaca fleet.json, mengembalikan struktur kosong:', e.message);
    return { ...EMPTY_FLEET_DATA };
  }
}

function writeFleetData(obj) {
  ensureDataDir();
  const tmp = FLEET_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf-8');
  fs.renameSync(tmp, FLEET_FILE);
}

function resetFleetData() {
  ensureDataDir();
  const raw = getDefaultFleetRaw();
  fs.writeFileSync(FLEET_FILE, raw, 'utf-8');
  return JSON.parse(raw);
}

// --- PIN akses cepat Gunex Fleet ---
// Disimpan di file TERPISAH dari fleet.json (bukan dicampur ke dalamnya),
// supaya tidak mengganggu validasi struktur data armada yang sudah ketat
// (vehicles/services/tireEvents/categories harus berupa array). PIN disimpan
// ter-hash dengan bcrypt, BUKAN plain text, persis seperti password admin.
// pinHash bernilai null artinya admin belum pernah mengatur PIN sama sekali -
// dalam kondisi ini, akses cepat lewat PIN di halaman login TIDAK aktif.
function ensurePinFile() {
  ensureDataDir();
  if (!fs.existsSync(FLEET_PIN_FILE)) {
    fs.writeFileSync(FLEET_PIN_FILE, JSON.stringify({ pinHash: null }, null, 2), 'utf-8');
  }
}

function readFleetPin() {
  ensurePinFile();
  try {
    return JSON.parse(fs.readFileSync(FLEET_PIN_FILE, 'utf-8'));
  } catch (e) {
    console.error('[fleet-pin] Gagal membaca fleet-pin.json, menganggap PIN belum diatur:', e.message);
    return { pinHash: null };
  }
}

function writeFleetPin(obj) {
  ensureDataDir();
  const tmp = FLEET_PIN_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf-8');
  fs.renameSync(tmp, FLEET_PIN_FILE);
}

// --- Pesan dari form "Hubungi Kami" di halaman publik ---
// Disimpan sebagai array pesan, terbaru di awal. Dibatasi MAX_MESSAGES agar
// file tidak membesar tanpa batas jika form disalahgunakan/spam dalam waktu
// lama tanpa admin pernah menghapusnya - pesan tertua otomatis dibuang saat
// melebihi batas, bukan dihapus diam-diam sebelum admin sempat membacanya
// (batasnya cukup besar untuk pemakaian wajar).
const MAX_MESSAGES = 500;

function ensureMessagesFile() {
  ensureDataDir();
  if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function readMessages() {
  ensureMessagesFile();
  try {
    const data = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf-8'));
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('[messages] Gagal membaca messages.json, mengembalikan daftar kosong:', e.message);
    return [];
  }
}

function writeMessages(arr) {
  ensureDataDir();
  const trimmed = arr.slice(0, MAX_MESSAGES);
  const tmp = MESSAGES_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(trimmed, null, 2), 'utf-8');
  fs.renameSync(tmp, MESSAGES_FILE);
}

function addMessage(msg) {
  const all = readMessages();
  all.unshift(msg); // pesan terbaru di awal, supaya admin lihat yang terbaru duluan
  writeMessages(all);
  return msg;
}

// --- Statistik kunjungan halaman publik ---
// Diagregasi PER HARI (bukan per-kunjungan sebagai record terpisah selamanya),
// supaya file tetap kecil walau dipakai bertahun-tahun. Struktur:
// { totalAllTime: number, byDate: { "2026-06-26": number, ... } }
function ensureStatsFile() {
  ensureDataDir();
  if (!fs.existsSync(STATS_FILE)) {
    fs.writeFileSync(STATS_FILE, JSON.stringify({ totalAllTime: 0, byDate: {} }, null, 2), 'utf-8');
  }
}

function readStats() {
  ensureStatsFile();
  try {
    const data = JSON.parse(fs.readFileSync(STATS_FILE, 'utf-8'));
    if (typeof data.totalAllTime !== 'number' || typeof data.byDate !== 'object' || data.byDate === null) {
      return { totalAllTime: 0, byDate: {} };
    }
    return data;
  } catch (e) {
    console.error('[stats] Gagal membaca stats.json, mengembalikan statistik kosong:', e.message);
    return { totalAllTime: 0, byDate: {} };
  }
}

function writeStats(obj) {
  ensureDataDir();
  const tmp = STATS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf-8');
  fs.renameSync(tmp, STATS_FILE);
}

// Menambah satu hitungan kunjungan untuk tanggal hari ini (format YYYY-MM-DD,
// dihitung di server agar konsisten apapun zona waktu perangkat pengunjung).
// Otomatis membersihkan entri byDate yang lebih tua dari 400 hari agar ukuran
// file tetap wajar dalam pemakaian jangka panjang (lebih dari setahun data
// harian, cukup untuk laporan tahunan, tapi tidak menumpuk selamanya).
function recordVisit() {
  const stats = readStats();
  const today = new Date().toISOString().slice(0, 10);
  stats.totalAllTime = (stats.totalAllTime || 0) + 1;
  stats.byDate[today] = (stats.byDate[today] || 0) + 1;

  const cutoff = Date.now() - 400 * 24 * 60 * 60 * 1000;
  for (const dateKey of Object.keys(stats.byDate)) {
    const t = new Date(dateKey + 'T00:00:00Z').getTime();
    if (!isNaN(t) && t < cutoff) delete stats.byDate[dateKey];
  }
  writeStats(stats);
  return stats;
}

module.exports = {
  readContent, writeContent, resetContent, readUsers, writeUsers,
  readFleetData, writeFleetData, resetFleetData,
  readFleetPin, writeFleetPin,
  readMessages, writeMessages, addMessage,
  readStats, writeStats, recordVisit,
  CONTENT_FILE, USERS_FILE, FLEET_FILE, DEFAULT_USERNAME, DEFAULT_PASSWORD
};
