const path = require('path');
const multer = require('multer');
const db = require('../database/db');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(process.cwd(), 'uploads')),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    cb(null, safeName);
  }
});

const fileFilter = (req, file, cb) => {
  const settings = db.prepare('SELECT allowed_file_types FROM settings WHERE id=1').get();
  const allowed = (settings?.allowed_file_types || '').split(',').map(v => v.trim());
  if (allowed.includes(file.mimetype)) return cb(null, true);
  return cb(new Error('File type not allowed'));
};

function buildUploader() {
  const settings = db.prepare('SELECT max_upload_size_mb FROM settings WHERE id=1').get();
  const maxSizeMb = settings?.max_upload_size_mb || 50;
  return multer({ storage, fileFilter, limits: { fileSize: maxSizeMb * 1024 * 1024 } });
}

module.exports = { buildUploader };
