const db = require('../config/database');
const { createOrder, verifyAndCapture, markOfflinePayment } = require('../services/paymentService');
const { sendSubmissionConfirmation, ignoreNonCriticalEmailFailure } = require('../services/emailService');
const { create: createNotification } = require('../services/notificationService');
const { log } = require('../services/auditService');
const { AppError } = require('../middleware/errorHandler');

// POST /api/payments/create-order
const createPaymentOrder = async (req, res, next) => {
  try {
    const { request_id } = req.body;
    const { rows } = await db.query(
      `SELECT r.*, u.full_name, u.email FROM rti_requests r JOIN users u ON r.citizen_id=u.id
       WHERE r.id=$1 AND r.citizen_id=$2 AND r.status='payment_pending'`,
      [request_id, req.user.id]
    );
    if (!rows[0]) return next(new AppError('Request not found or payment not required.', 404));

    const result = await createOrder(request_id, req.user.id, rows[0].fee_amount || 10, 'rti_fee');
    await log('payment', result.payment.id, 'ORDER_CREATED', req.user.id, null, result.payment, req);

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

// POST /api/payments/verify
const verifyPayment = async (req, res, next) => {
  try {
    const { payment_id, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    const result = await verifyAndCapture(payment_id, razorpay_payment_id, razorpay_order_id, razorpay_signature);
    if (!result.success) return next(new AppError(result.reason, 400));

    // Get request + user details for confirmation email
    const { rows } = await db.query(
      `SELECT r.registration_number, r.deadline_date, u.full_name, u.email, pa.name AS authority_name
       FROM rti_requests r JOIN users u ON r.citizen_id=u.id JOIN public_authorities pa ON r.authority_id=pa.id
       WHERE r.id=$1`,
      [result.payment.request_id]
    );
    if (rows[0]) {
      try {
        await sendSubmissionConfirmation(rows[0].email, rows[0].full_name, rows[0].registration_number, rows[0].authority_name, rows[0].deadline_date);
      } catch (emailErr) {
        ignoreNonCriticalEmailFailure(emailErr, 'Payment confirmation email');
      }
      await createNotification(req.user.id, 'Payment Successful', `Payment received. Application ref: ${rows[0].registration_number}`, 'rti_request', result.payment.request_id);
    }

    await log('payment', payment_id, 'PAYMENT_SUCCESS', req.user.id, null, { razorpay_payment_id }, req);
    res.json({ success: true, message: 'Payment verified. Application submitted.', data: result.payment });
  } catch (err) { next(err); }
};

// POST /api/payments/offline
const offlinePayment = async (req, res, next) => {
  try {
    const { request_id, mode, dd_number, dd_bank, dd_date } = req.body;
    const payment = await markOfflinePayment(request_id, req.user.id, mode, { ddNumber: dd_number, ddBank: dd_bank, ddDate: dd_date });
    await db.query(`UPDATE rti_requests SET status='payment_pending' WHERE id=$1`, [request_id]);
    res.json({ success: true, message: 'Offline payment registered. Pending verification.', data: payment });
  } catch (err) { next(err); }
};

// GET /api/payments/:request_id
const getPayments = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT p.* FROM payments p JOIN rti_requests r ON p.request_id=r.id
       WHERE p.request_id=$1 AND r.citizen_id=$2 ORDER BY p.created_at DESC`,
      [req.params.request_id, req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

module.exports = { createPaymentOrder, verifyPayment, offlinePayment, getPayments };
