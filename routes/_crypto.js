const crypto = require('crypto');

const key = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY || 'default_32_character_key_here_123456').digest();

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(encText) {
  const [ivHex, dataHex] = encText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedText = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString('utf8');
}

function maskToken(token) {
  if (!token) return '';
  if (token.length < 10) return '****';
  return `${token.slice(0, 4)}****${token.slice(-4)}`;
}

module.exports = { encrypt, decrypt, maskToken };
