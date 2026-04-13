const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const logger = require('../utils/logger');

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const createOTP = async (email, purpose = 'login', ipAddress = null) => {
  const otp = generateOTP();
  const hash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate previous unused OTPs for same email+purpose
  await db.query(
    `UPDATE otp_tokens SET used = true WHERE email = $1 AND purpose = $2 AND used = false`,
    [email, purpose]
  );

  await db.query(
    `INSERT INTO otp_tokens (id, email, otp_hash, purpose, expires_at, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [uuidv4(), email, hash, purpose, expiresAt, ipAddress]
  );

  logger.debug(`OTP ${otp} created for ${email} [${purpose}]`);
  return otp;
};

const verifyOTP = async (email, otp, purpose = 'login') => {
  const { rows } = await db.query(
    `SELECT * FROM otp_tokens
     WHERE email = $1 AND purpose = $2 AND used = false AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [email, purpose]
  );

  if (!rows[0]) return { valid: false, reason: 'OTP expired or not found.' };

  const token = rows[0];

  if (token.attempts >= MAX_ATTEMPTS) {
    await db.query(`UPDATE otp_tokens SET used = true WHERE id = $1`, [token.id]);
    return { valid: false, reason: 'Too many attempts. Please request a new OTP.' };
  }

  const match = await bcrypt.compare(otp, token.otp_hash);

  if (!match) {
    await db.query(`UPDATE otp_tokens SET attempts = attempts + 1 WHERE id = $1`, [token.id]);
    return { valid: false, reason: 'Invalid OTP.' };
  }

  await db.query(`UPDATE otp_tokens SET used = true WHERE id = $1`, [token.id]);
  return { valid: true };
};

module.exports = { createOTP, verifyOTP };
