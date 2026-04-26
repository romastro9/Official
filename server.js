require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('./database/db');

const authRoutes = require('./routes/auth');
const facebookRoutes = require('./routes/facebook');
const pagesRoutes = require('./routes/pages');
const postsRoutes = require('./routes/posts');
const historyRoutes = require('./routes/history');
const settingsRoutes = require('./routes/settings');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'change_me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 1000 * 60 * 60 * 12 }
}));

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.use('/api/auth', authRoutes);
app.use('/api/facebook', facebookRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/settings', settingsRoutes);
app.get('/api/me', require('./middleware/auth').requireAuth, (req, res) => res.json({ user: req.session.admin }));

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.use((err, req, res, next) => {
  if (err.message.includes('File type not allowed')) return res.status(400).json({ error: err.message });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large' });
  return res.status(500).json({ error: 'Server error', detail: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MasterPost AI running on http://localhost:${PORT}`));
