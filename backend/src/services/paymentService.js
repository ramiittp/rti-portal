const Razorpay = require('razorpay');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const logger = require('../utils/logger');

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const RTI_FEE = 10; // ₹10 standard RTI fee

const createOrder = async (requestId, citizenId, amount = RTI_FEE, purpose = 'rti_fee') => {
  const receiptNumber = `RTI-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  let razorpayOrder = null;
  if (process.env.NODE_ENV !== 'development') {
    razorpayOrder = await getRazorpay().orders.create({
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: receiptNumber,
      notes: { requestId, citizenId, purpose },
    });
  } else {
    razorpayOrder = { id: `order_dev_${uuidv4().slice(0, 8)}` };
    logger.debug(`[PAYMENT DEV] Mock Razorpay order: ${razorpayOrder.id}`);
  }

  const { rows } = await db.query(
    `INSERT INTO payments (id, request_id, citizen_id, amount, status, razorpay_order_id, receipt_number, purpose)
     VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7) RETURNING *`,
    [uuidv4(), requestId, citizenId, amount, razorpayOrder.id, receiptNumber, purpose]
  );

  return { payment: rows[0], orderId: razorpayOrder.id, amount, receiptNumber, keyId: process.env.RAZORPAY_KEY_ID };
};

const verifyAndCapture = async (paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature) => {
  // Verify Razorpay signature
  if (process.env.NODE_ENV !== 'development') {
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      await db.query(
        `UPDATE payments SET status = 'failed', failure_reason = 'Signature mismatch' WHERE id = $1`,
        [paymentId]
      );
      return { success: false, reason: 'Payment signature verification failed.' };
    }
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `UPDATE payments
       SET status = 'success', razorpay_payment_id = $1, razorpay_signature = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [razorpayPaymentId, razorpaySignature, paymentId]
    );

    const payment = rows[0];

    // Update RTI request status
    await client.query(
      `UPDATE rti_requests SET status = 'payment_done', updated_at = NOW() WHERE id = $1`,
      [payment.request_id]
    );

    await client.query('COMMIT');
    logger.info(`Payment captured: ${paymentId} for request ${payment.request_id}`);
    return { success: true, payment };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Payment capture failed:', err);
    throw err;
  } finally {
    client.release();
  }
};

const markOfflinePayment = async (requestId, citizenId, mode, details) => {
  const receiptNumber = `RTI-OFF-${Date.now()}`;
  const { rows } = await db.query(
    `INSERT INTO payments (id, request_id, citizen_id, amount, status, mode, receipt_number, dd_number, dd_bank, dd_date, purpose)
     VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, 'rti_fee') RETURNING *`,
    [uuidv4(), requestId, citizenId, RTI_FEE, mode,
     receiptNumber, details.ddNumber, details.ddBank, details.ddDate]
  );
  return rows[0];
};

module.exports = { createOrder, verifyAndCapture, markOfflinePayment, RTI_FEE };
