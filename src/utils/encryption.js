const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const key = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const iv = process.env.ENCRYPTION_IV || crypto.randomBytes(16);

/**
 * Encrypt a string
 * @param {string} text Text to encrypt
 * @returns {string} Encrypted text
 */
exports.encrypt = (text) => {
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

/**
 * Decrypt a string
 * @param {string} text Encrypted text to decrypt
 * @returns {string} Decrypted text
 */
exports.decrypt = (text) => {
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
  let decrypted = decipher.update(text, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
