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

module.exports = {
  readContent, writeContent, resetContent, readUsers, writeUsers,
  readFleetData, writeFleetData, resetFleetData,
  CONTENT_FILE, USERS_FILE, FLEET_FILE, DEFAULT_USERNAME, DEFAULT_PASSWORD
};
