const express = require('express');
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');
const { decrypt, maskToken } = require('./_crypto');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT id,page_id,page_name,page_token_enc,created_at FROM pages ORDER BY created_at DESC').all();
  res.json(rows.map(r => ({ ...r, token_preview: maskToken(decrypt(r.page_token_enc)), page_token_enc: undefined })));
});

router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM pages WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Page not found' });
  res.json({ message: 'Page removed' });
});

module.exports = router;
