const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const DEFAULT_FILE = path.join(DATA_DIR, 'content.default.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureContentFile() {
  if (!fs.existsSync(CONTENT_FILE)) {
    const def = fs.readFileSync(DEFAULT_FILE, 'utf-8');
    fs.writeFileSync(CONTENT_FILE, def, 'utf-8');
  }
}

function readContent() {
  ensureContentFile();
  const raw = fs.readFileSync(CONTENT_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeContent(obj) {
  const tmp = CONTENT_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf-8');
  fs.renameSync(tmp, CONTENT_FILE);
}

function resetContent() {
  const def = fs.readFileSync(DEFAULT_FILE, 'utf-8');
  fs.writeFileSync(CONTENT_FILE, def, 'utf-8');
  return JSON.parse(def);
}

function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return null;
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

function writeUsers(obj) {
  const tmp = USERS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf-8');
  fs.renameSync(tmp, USERS_FILE);
}

module.exports = { readContent, writeContent, resetContent, readUsers, writeUsers, CONTENT_FILE, USERS_FILE };
