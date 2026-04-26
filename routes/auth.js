const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, admin.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  req.session.admin = { id: admin.id, username: admin.username };
  res.json({ message: 'Logged in', user: req.session.admin });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Logged out' }));
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.session.admin });
});

module.exports = router;
