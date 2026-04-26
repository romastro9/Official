const express = require('express');
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM settings WHERE id=1').get());
});

router.put('/', requireAuth, (req, res) => {
  const current = db.prepare('SELECT * FROM settings WHERE id=1').get();
  const next = { ...current, ...req.body, id: 1 };
  db.prepare(`UPDATE settings SET app_name=@app_name,default_caption_footer=@default_caption_footer,max_upload_size_mb=@max_upload_size_mb,allowed_file_types=@allowed_file_types,theme=@theme,language=@language WHERE id=1`).run(next);
  res.json({ message: 'Settings saved', settings: db.prepare('SELECT * FROM settings WHERE id=1').get() });
});

module.exports = router;
