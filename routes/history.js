const express = require('express');
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const { status, type, page } = req.query;
  let sql = 'SELECT * FROM posts WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status=?'; params.push(status); }
  if (type) { sql += ' AND type=?'; params.push(type); }
  if (page) { sql += ' AND page_id=?'; params.push(page); }
  sql += ' ORDER BY created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM posts WHERE id=?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'History not found' });
  res.json({ message: 'History deleted' });
});

router.post('/:id/retry', requireAuth, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id=?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post history not found' });
  if (post.status !== 'failed') return res.status(400).json({ error: 'Only failed posts can be retried' });
  db.prepare('UPDATE posts SET status=?, error_message=? WHERE id=?').run('failed', 'Retry requested. Re-submit from Power Editor/Photo Carousel for full payload.', post.id);
  res.json({ message: 'Retry recorded. Please submit again from posting module.' });
});

module.exports = router;
