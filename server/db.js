const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const EMBEDDED_DEFAULT_CONTENT = require('./default-content');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const DEFAULT_FILE = path.join(DATA_DIR, 'content.default.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'gunex2008admin';

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
  const raw = fs.readFileSync(CONTENT_FILE, 'utf-8');
  return JSON.parse(raw);
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

module.exports = { readContent, writeContent, resetContent, readUsers, writeUsers, CONTENT_FILE, USERS_FILE, DEFAULT_USERNAME, DEFAULT_PASSWORD };
