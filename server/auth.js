const express = require('express');
const bcrypt = require('bcryptjs');
const { readUsers, writeUsers } = require('./db');

const router = express.Router();

function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ ok: false, error: 'Belum login.' });
}

router.post('/login', (req, res) => {
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
    return res.status(401).json({ ok: false, error: 'Username atau password salah.' });
  }
  const match = bcrypt.compareSync(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ ok: false, error: 'Username atau password salah.' });
  }
  req.session.isAdmin = true;
  req.session.username = username;
  res.json({ ok: true, username });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get('/me', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.json({ ok: true, loggedIn: true, username: req.session.username });
  }
  res.json({ ok: true, loggedIn: false });
});

router.post('/change-password', requireAuth, (req, res) => {
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
    return res.status(401).json({ ok: false, error: 'Password lama salah.' });
  }
  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  writeUsers(user);
  res.json({ ok: true });
});

module.exports = { router, requireAuth };
