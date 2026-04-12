const db = require('../config/database');
const { sendStatusUpdate, sendAdditionalFeeNotice } = require('../services/emailService');
const { create: createNotification } = require('../services/notificationService');
const { log } = require('../services/auditService');
const { createOrder } = require('../services/paymentService');
const { AppError } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');

// GET /api/admin/requests — CPIO inbox
const listAdminRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let conditions = [];
    let params = [];
    let i = 1;

    if (req.user.role === 'cpio') {
      conditions.push(`r.authority_id = $${i++}`);
      params.push(req.user.authority_id);
    }
    if (status) { conditions.push(`r.status = $${i++}`); params.push(status); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT r.id, r.registration_number, r.subject, r.status, r.submitted_at,
              r.deadline_date, u.full_name AS citizen_name, u.email AS citizen_email,
              pa.name AS authority_name
       FROM rti_requests r JOIN users u ON r.citizen_id=u.id
       JOIN public_authorities pa ON r.authority_id=pa.id
       ${where} ORDER BY r.submitted_at ASC NULLS LAST LIMIT $${i++} OFFSET $${i}`,
      [...params, limit, offset]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// PUT /api/admin/requests/:id/assign — Nodal Officer assigns to CPIO
const assignCpio = async (req, res, next) => {
  try {
    const { cpio_id } = req.body;
    const { rows } = await db.query(
      `UPDATE rti_requests SET assigned_cpio_id=$1, status='assigned', updated_at=NOW()
       WHERE id=$2 RETURNING *`,
      [cpio_id, req.params.id]
    );
    if (!rows[0]) return next(new AppError('Request not found.', 404));
    await log('rti_request', req.params.id, 'ASSIGN_CPIO', req.user.id, null, { cpio_id }, req);
    res.json({ success: true, message: 'Request assigned.', data: rows[0] });
  } catch (err) { next(err); }
};

// PUT /api/admin/requests/:id/reply — CPIO replies
const replyRequest = async (req, res, next) => {
  try {
    const { response_text, status = 'replied' } = req.body;
    const { rows } = await db.query(
      `UPDATE rti_requests SET response_text=$1, status=$2, response_date=NOW(), updated_at=NOW()
       WHERE id=$3 AND assigned_cpio_id=$4 RETURNING *, (SELECT email FROM users WHERE id=citizen_id) AS citizen_email,
       (SELECT full_name FROM users WHERE id=citizen_id) AS citizen_name`,
      [response_text, status, req.params.id, req.user.id]
    );
    if (!rows[0]) return next(new AppError('Request not found or not assigned to you.', 404));

    await sendStatusUpdate(rows[0].citizen_email, rows[0].citizen_name, rows[0].registration_number, status, response_text.substring(0, 200) + '...');
    await createNotification(rows[0].citizen_id, 'Application Replied', `Your RTI ${rows[0].registration_number} has received a response.`, 'rti_request', req.params.id);
    await log('rti_request', req.params.id, 'REPLY', req.user.id, null, { status, response_text: response_text.substring(0, 100) }, req);

    res.json({ success: true, message: 'Reply submitted.', data: rows[0] });
  } catch (err) { next(err); }
};

// PUT /api/admin/requests/:id/transfer
const transferRequest = async (req, res, next) => {
  try {
    const { to_authority_id, reason } = req.body;
    const { rows: reqRows } = await db.query(`SELECT * FROM rti_requests WHERE id=$1`, [req.params.id]);
    if (!reqRows[0]) return next(new AppError('Not found.', 404));
    if (reqRows[0].transfer_count >= 1) return next(new AppError('Request can only be transferred once as per RTI Act.', 400));

    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO request_transfers (id, request_id, from_authority_id, to_authority_id, transferred_by, reason)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [uuidv4(), req.params.id, reqRows[0].authority_id, to_authority_id, req.user.id, reason]
      );
      await client.query(
        `UPDATE rti_requests SET authority_id=$1, status='transferred', transfer_count=transfer_count+1,
         deadline_date=(NOW()+INTERVAL '30 days')::DATE, updated_at=NOW() WHERE id=$2`,
        [to_authority_id, req.params.id]
      );
      await client.query('COMMIT');
    } catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }

    await log('rti_request', req.params.id, 'TRANSFER', req.user.id, { authority_id: reqRows[0].authority_id }, { authority_id: to_authority_id }, req);
    res.json({ success: true, message: 'Request transferred successfully.' });
  } catch (err) { next(err); }
};

// POST /api/admin/requests/:id/additional-fee
const raiseAdditionalFee = async (req, res, next) => {
  try {
    const { amount, reason, deadline } = req.body;
    const { rows: reqRows } = await db.query(
      `SELECT r.*, u.email, u.full_name FROM rti_requests r JOIN users u ON r.citizen_id=u.id WHERE r.id=$1`,
      [req.params.id]
    );
    if (!reqRows[0]) return next(new AppError('Not found.', 404));

    const { rows } = await db.query(
      `INSERT INTO additional_fee_requests (id, request_id, raised_by, amount, reason, deadline)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [uuidv4(), req.params.id, req.user.id, amount, reason, deadline]
    );
    await db.query(`UPDATE rti_requests SET status='additional_fee_pending', updated_at=NOW() WHERE id=$1`, [req.params.id]);
    await sendAdditionalFeeNotice(reqRows[0].email, reqRows[0].full_name, reqRows[0].registration_number, amount, reason, deadline);
    await createNotification(reqRows[0].citizen_id, 'Additional Fee Required', `₹${amount} additional fee required for ${reqRows[0].registration_number}.`, 'rti_request', req.params.id);

    res.json({ success: true, message: 'Additional fee request raised.', data: rows[0] });
  } catch (err) { next(err); }
};

// GET /api/admin/analytics — super_admin only
const getAnalytics = async (req, res, next) => {
  try {
    const [statusSummary, monthlySummary, authorityLoad, avgResponseTime] = await Promise.all([
      db.query(`SELECT status, COUNT(*) FROM rti_requests GROUP BY status ORDER BY COUNT DESC`),
      db.query(`SELECT TO_CHAR(created_at,'YYYY-MM') AS month, COUNT(*) FROM rti_requests
                WHERE created_at > NOW()-INTERVAL '12 months' GROUP BY month ORDER BY month`),
      db.query(`SELECT pa.name, COUNT(r.id) AS total, COUNT(CASE WHEN r.status='replied' THEN 1 END) AS replied
                FROM rti_requests r JOIN public_authorities pa ON r.authority_id=pa.id
                GROUP BY pa.name ORDER BY total DESC LIMIT 10`),
      db.query(`SELECT AVG(EXTRACT(EPOCH FROM (response_date-submitted_at))/86400)::INT AS avg_days
                FROM rti_requests WHERE response_date IS NOT NULL AND submitted_at IS NOT NULL`),
    ]);
    res.json({
      success: true,
      data: {
        statusSummary: statusSummary.rows,
        monthlySummary: monthlySummary.rows,
        authorityLoad: authorityLoad.rows,
        avgResponseDays: avgResponseTime.rows[0]?.avg_days || 0,
      },
    });
  } catch (err) { next(err); }
};

module.exports = { listAdminRequests, assignCpio, replyRequest, transferRequest, raiseAdditionalFee, getAnalytics };
