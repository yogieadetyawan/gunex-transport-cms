const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

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

function ensureContentFile() {
  ensureDataDir();
  if (!fs.existsSync(CONTENT_FILE)) {
    // Jika content.default.json juga tidak ada (mis. volume kosong menimpa folder data),
    // fallback ke struktur minimal agar server tetap bisa jalan.
    const def = fs.existsSync(DEFAULT_FILE)
      ? fs.readFileSync(DEFAULT_FILE, 'utf-8')
      : JSON.stringify(MINIMAL_CONTENT, null, 2);
    fs.writeFileSync(CONTENT_FILE, def, 'utf-8');
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

const MINIMAL_CONTENT = {
  brand: { companyName: 'PT. Gunex Transport Indonesia', shortName: 'GUNEX TRANSPORT', tagline: '' },
  hero: { eyebrow: '', headline: '', headlineAccent: '', lead: '', ctaPrimary: '', ctaSecondary: '', stats: [] },
  about: { kicker: '', headline: '', lede: '', paragraphs: [], profile: [] },
  services: { kicker: '', headline: '', lede: '', items: [] },
  fleet: { kicker: '', headline: '', lede: '', items: [], totalUnit: '0' },
  flow: { kicker: '', headline: '', lede: '', steps: [] },
  coverage: { kicker: '', headline: '', lede: '', areas: [] },
  clients: { kicker: '', headline: '', lede: '', items: [] },
  contact: { kicker: '', headline: '', lede: '', address: '', addressNote: '', phone: '', email: '', hours: '' },
  footer: { text: '' }
};

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
  const def = fs.existsSync(DEFAULT_FILE)
    ? fs.readFileSync(DEFAULT_FILE, 'utf-8')
    : JSON.stringify(MINIMAL_CONTENT, null, 2);
  fs.writeFileSync(CONTENT_FILE, def, 'utf-8');
  return JSON.parse(def);
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
