const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter;

const shouldIgnoreNonCriticalEmailFailures = () => {
  const configured = process.env.NON_CRITICAL_EMAIL_FAILURES;

  if (configured === undefined) {
    return process.env.NODE_ENV !== 'production';
  }

  return String(configured).toLowerCase() === 'true';
};

const ignoreNonCriticalEmailFailure = (err, context = 'Email notification') => {
  if (!shouldIgnoreNonCriticalEmailFailures()) {
    throw err;
  }

  logger.warn(`${context} skipped because email is unavailable: ${err.message}`);
};

const getFromAddress = () => {
  const fromName = process.env.SMTP_FROM_NAME || 'RTI Portal';
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.EMAIL_FROM || process.env.SMTP_USER;

  if (!fromEmail) {
    const err = new Error('SMTP sender email is not configured. Set SMTP_FROM_EMAIL or EMAIL_FROM.');
    err.statusCode = 503;
    throw err;
  }

  return `"${fromName}" <${fromEmail}>`;
};

const getTransporter = () => {
  if (!transporter) {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      const err = new Error('SMTP is not fully configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.');
      err.statusCode = 503;
      throw err;
    }

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_PORT === '465',
      auth: { user, pass },
    });
  }

  return transporter;
};

const send = async ({ to, subject, html, text }) => {
  try {
    const info = await getTransporter().sendMail({
      from: getFromAddress(),
      to, subject, html, text,
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Email send failed to ${to}:`, err);
    throw err;
  }
};

const sendOTPEmail = (email, otp, name = 'Citizen') =>
  send({
    to: email,
    subject: 'Your RTI Portal Login OTP',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;padding:32px;">
        <h2 style="color:#01696f;">RTI Portal — OTP Verification</h2>
        <p>Dear ${name},</p>
        <p>Your One-Time Password (OTP) for login is:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#01696f;margin:24px 0;">${otp}</div>
        <p>This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <p style="color:#999;font-size:12px;">If you did not request this, please ignore this email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
        <p style="color:#999;font-size:11px;">RTI Portal | Government of India</p>
      </div>`,
    text: `Your RTI Portal OTP is: ${otp}. Valid for 10 minutes.`,
  });

const sendSubmissionConfirmation = (email, name, regNumber, authorityName, deadline) =>
  send({
    to: email,
    subject: `RTI Application Submitted — ${regNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;padding:32px;">
        <h2 style="color:#01696f;">Application Submitted Successfully</h2>
        <p>Dear ${name},</p>
        <p>Your RTI application has been submitted successfully.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold;">Registration No.</td><td style="padding:8px;">${regNumber}</td></tr>
          <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold;">Authority</td><td style="padding:8px;">${authorityName}</td></tr>
          <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold;">Response Deadline</td><td style="padding:8px;">${deadline}</td></tr>
        </table>
        <p>The Public Information Officer (CPIO) is required to respond within <strong>30 days</strong> as per the RTI Act, 2005.</p>
        <p style="color:#999;font-size:11px;">RTI Portal | Government of India</p>
      </div>`,
  });

const sendStatusUpdate = (email, name, regNumber, status, message = '') =>
  send({
    to: email,
    subject: `RTI Application Update — ${regNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;padding:32px;">
        <h2 style="color:#01696f;">Application Status Update</h2>
        <p>Dear ${name},</p>
        <p>Your RTI application <strong>${regNumber}</strong> status has been updated to: <strong>${status.toUpperCase()}</strong>.</p>
        ${message ? `<p>${message}</p>` : ''}
        <p>Log in to your RTI Portal account to view full details.</p>
        <p style="color:#999;font-size:11px;">RTI Portal | Government of India</p>
      </div>`,
  });

const sendAdditionalFeeNotice = (email, name, regNumber, amount, reason, deadline) =>
  send({
    to: email,
    subject: `Additional Fee Required — ${regNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;padding:32px;">
        <h2 style="color:#964219;">Additional Fee Required</h2>
        <p>Dear ${name},</p>
        <p>An additional fee of <strong>₹${amount}</strong> is required for your RTI application <strong>${regNumber}</strong>.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Payment Deadline:</strong> ${deadline}</p>
        <p>Please log in to RTI Portal to pay the fee. Failure to pay by the deadline may result in closure of your application.</p>
        <p style="color:#999;font-size:11px;">RTI Portal | Government of India</p>
      </div>`,
  });

module.exports = {
  sendOTPEmail,
  sendSubmissionConfirmation,
  sendStatusUpdate,
  sendAdditionalFeeNotice,
  ignoreNonCriticalEmailFailure,
};
