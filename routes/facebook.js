const express = require('express');
const axios = require('axios');
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');
const { encrypt, maskToken } = require('./_crypto');

const router = express.Router();
const GRAPH = 'https://graph.facebook.com/v20.0';

router.post('/verify-token', requireAuth, async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'Token is required' });
    const response = await axios.get(`${GRAPH}/me`, { params: { access_token: token } });
    return res.json({ valid: true, profile: response.data, token_preview: maskToken(token) });
  } catch (e) {
    return res.status(400).json({ valid: false, error: e.response?.data?.error?.message || 'Invalid token' });
  }
});

router.post('/fetch-pages', requireAuth, async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'Token is required' });
    const response = await axios.get(`${GRAPH}/me/accounts`, { params: { access_token: token } });
    const pages = response.data?.data || [];
    const insert = db.prepare('INSERT OR REPLACE INTO pages (id,page_id,page_name,page_token_enc) VALUES ((SELECT id FROM pages WHERE page_id=?),?,?,?)');
    const tx = db.transaction((items) => {
      for (const p of items) insert.run(p.id, p.id, p.name, encrypt(p.access_token));
    });
    tx(pages);
    res.json({ message: 'Pages fetched', count: pages.length, pages: pages.map(p => ({ page_id: p.id, page_name: p.name, token_preview: maskToken(p.access_token) })) });
  } catch (e) {
    res.status(400).json({ error: e.response?.data?.error?.message || 'Unable to fetch pages' });
  }
});

module.exports = router;
