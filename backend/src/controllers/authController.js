const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { createOTP, verifyOTP } = require('../services/otpService');
const { sendOTPEmail } = require('../services/emailService');
const { log } = require('../services/auditService');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const isOtpFallbackEnabled = () => {
  const configured = process.env.OTP_FALLBACK_IN_RESPONSE;

  if (configured === undefined) {
    return process.env.NODE_ENV !== 'production';
  }

  return String(configured).toLowerCase() === 'true';
};

// POST /api/auth/send-otp
const sendOtp = async (req, res, next) => {
  try {
    const { email, name } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Upsert user
    const { rows } = await db.query(
      `INSERT INTO users (id, email, full_name, role)
       VALUES ($1, $2, $3, 'citizen')
       ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
       RETURNING id, full_name, email, is_email_verified`,
      [uuidv4(), normalizedEmail, name || 'Citizen']
    );

    const user = rows[0];
    const otp = await createOTP(normalizedEmail, 'login', req.ip);

    try {
      await sendOTPEmail(normalizedEmail, otp, user.full_name);
    } catch (emailErr) {
      if (!isOtpFallbackEnabled()) {
        throw emailErr;
      }

      logger.warn(`OTP email failed for ${normalizedEmail}; returning fallback OTP in response.`);
      return res.json({
        success: true,
        message: 'Email service is unavailable. Showing OTP locally for development use.',
        email: normalizedEmail,
        otp,
        fallback: 'local_alert',
      });
    }

    res.json({ success: true, message: 'OTP sent to your email address.', email: normalizedEmail });
  } catch (err) { next(err); }
};

// POST /api/auth/verify-otp
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const result = await verifyOTP(normalizedEmail, otp, 'login');
    if (!result.valid) return next(new AppError(result.reason, 400));

    const { rows } = await db.query(
      `UPDATE users SET is_email_verified = true, updated_at = NOW()
       WHERE email = $1 RETURNING id, full_name, email, role, authority_id, profile_complete`,
      [normalizedEmail]
    );
    const user = rows[0];
    if (!user) return next(new AppError('User not found.', 404));

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    await log('user', user.id, 'LOGIN', user.id, null, null, req);

    res.json({
      success: true, message: 'Login successful.',
      token,
      user: { id: user.id, name: user.full_name, email: user.email, role: user.role, profileComplete: user.profile_complete },
    });
  } catch (err) { next(err); }
};

// GET /api/auth/profile
const getProfile = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT id, full_name, email, phone, role, address, city, state, pincode,
              preferred_language, profile_complete, is_email_verified, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    res.json({ success: true, user: rows[0] });
  } catch (err) { next(err); }
};

// PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const { full_name, phone, address, city, state, pincode, preferred_language } = req.body;
    const { rows } = await db.query(
      `UPDATE users SET full_name=$1, phone=$2, address=$3, city=$4, state=$5,
        pincode=$6, preferred_language=$7, profile_complete=true, updated_at=NOW()
       WHERE id=$8 RETURNING id, full_name, email, phone, role, profile_complete`,
      [full_name, phone, address, city, state, pincode, preferred_language, req.user.id]
    );
    res.json({ success: true, message: 'Profile updated.', user: rows[0] });
  } catch (err) { next(err); }
};

module.exports = { sendOtp, verifyOtp, getProfile, updateProfile };
