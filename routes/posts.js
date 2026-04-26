const fs = require('fs');
const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');
const { buildUploader } = require('../middleware/upload');
const { decrypt } = require('./_crypto');

const router = express.Router();
const upload = buildUploader();
const GRAPH = 'https://graph.facebook.com/v20.0';

function addFooter(caption) {
  const s = db.prepare('SELECT default_caption_footer FROM settings WHERE id=1').get();
  return [caption || '', s?.default_caption_footer || ''].filter(Boolean).join('\n');
}

function logPost(row) {
  return db.prepare(`INSERT INTO posts (page_id,page_name,type,caption,file_name,file_url,status,facebook_post_id,error_message,payload_json) VALUES (@page_id,@page_name,@type,@caption,@file_name,@file_url,@status,@facebook_post_id,@error_message,@payload_json)`).run(row);
}

router.post('/video', requireAuth, upload.single('video'), async (req, res) => {
  const { pageIds = '[]', caption = '', videoUrl = '' } = req.body;
  const targetIds = JSON.parse(pageIds);
  if (!Array.isArray(targetIds) || !targetIds.length) return res.status(400).json({ error: 'Select at least one page' });
  if (!req.file && !videoUrl) return res.status(400).json({ error: 'Upload a video or provide video URL' });

  const pages = db.prepare(`SELECT * FROM pages WHERE page_id IN (${targetIds.map(() => '?').join(',')})`).all(...targetIds);
  const finalCaption = addFooter(caption);
  const results = [];

  for (const page of pages) {
    try {
      let response;
      const access_token = decrypt(page.page_token_enc);
      if (req.file) {
        const form = new FormData();
        form.append('description', finalCaption);
        form.append('access_token', access_token);
        form.append('source', fs.createReadStream(req.file.path));
        response = await axios.post(`${GRAPH}/${page.page_id}/videos`, form, { headers: form.getHeaders() });
      } else {
        response = await axios.post(`${GRAPH}/${page.page_id}/videos`, null, { params: { access_token, file_url: videoUrl, description: finalCaption } });
      }
      logPost({ page_id: page.page_id, page_name: page.page_name, type: 'video', caption: finalCaption, file_name: req.file?.filename || null, file_url: videoUrl || null, status: 'success', facebook_post_id: response.data.id || null, error_message: null, payload_json: JSON.stringify({ pageId: page.page_id }) });
      results.push({ page_id: page.page_id, status: 'success', post_id: response.data.id });
    } catch (e) {
      const message = e.response?.data?.error?.message || 'Failed to post video';
      logPost({ page_id: page.page_id, page_name: page.page_name, type: 'video', caption: finalCaption, file_name: req.file?.filename || null, file_url: videoUrl || null, status: 'failed', facebook_post_id: null, error_message: message, payload_json: JSON.stringify({ pageId: page.page_id }) });
      results.push({ page_id: page.page_id, status: 'failed', error: message });
    }
  }

  res.json({ message: 'Video post processing completed', results });
});

router.post('/photos', requireAuth, upload.array('photos', 20), async (req, res) => {
  const { pageIds = '[]', caption = '' } = req.body;
  const targetIds = JSON.parse(pageIds);
  if (!Array.isArray(targetIds) || !targetIds.length) return res.status(400).json({ error: 'Select at least one page' });
  if (!req.files?.length) return res.status(400).json({ error: 'Upload at least one photo' });

  const pages = db.prepare(`SELECT * FROM pages WHERE page_id IN (${targetIds.map(() => '?').join(',')})`).all(...targetIds);
  const finalCaption = addFooter(caption);
  const results = [];

  for (const page of pages) {
    const access_token = decrypt(page.page_token_enc);
    for (const [i, photo] of req.files.entries()) {
      try {
        const form = new FormData();
        form.append('caption', i === 0 ? finalCaption : '');
        form.append('access_token', access_token);
        form.append('source', fs.createReadStream(photo.path));
        const response = await axios.post(`${GRAPH}/${page.page_id}/photos`, form, { headers: form.getHeaders() });
        logPost({ page_id: page.page_id, page_name: page.page_name, type: 'photo', caption: finalCaption, file_name: photo.filename, file_url: null, status: 'success', facebook_post_id: response.data.post_id || response.data.id || null, error_message: null, payload_json: JSON.stringify({ pageId: page.page_id }) });
        results.push({ page_id: page.page_id, file: photo.filename, status: 'success' });
      } catch (e) {
        const message = e.response?.data?.error?.message || 'Failed to post photo';
        logPost({ page_id: page.page_id, page_name: page.page_name, type: 'photo', caption: finalCaption, file_name: photo.filename, file_url: null, status: 'failed', facebook_post_id: null, error_message: message, payload_json: JSON.stringify({ pageId: page.page_id }) });
        results.push({ page_id: page.page_id, file: photo.filename, status: 'failed', error: message });
      }
    }
  }

  res.json({ message: 'Photo posting completed', results });
});

module.exports = router;
