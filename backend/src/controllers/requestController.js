const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { sendSubmissionConfirmation, ignoreNonCriticalEmailFailure } = require('../services/emailService');
const { create: createNotification } = require('../services/notificationService');
const { log } = require('../services/auditService');
const { AppError } = require('../middleware/errorHandler');

// POST /api/requests — create draft
const createRequest = async (req, res, next) => {
  try {
    const {
      authority_id, subject, description, information_sought,
      period_from, period_to, preferred_response_mode = 'email',
      is_bpl = false, bpl_card_number, language = 'en', template_used
    } = req.body;

    const { rows } = await db.query(
      `INSERT INTO rti_requests
       (id, citizen_id, authority_id, subject, description, information_sought,
        period_from, period_to, preferred_response_mode, is_bpl, bpl_card_number,
        language, template_used, status, fee_waived)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'draft',$14) RETURNING *`,
      [uuidv4(), req.user.id, authority_id, subject, description, information_sought,
       period_from || null, period_to || null, preferred_response_mode,
       is_bpl, bpl_card_number || null, language, template_used || null, is_bpl]
    );

    await log('rti_request', rows[0].id, 'CREATE_DRAFT', req.user.id, null, rows[0], req);
    res.status(201).json({ success: true, message: 'Draft created.', data: rows[0] });
  } catch (err) { next(err); }
};

// PUT /api/requests/:id — update draft
const updateRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subject, description, information_sought, period_from, period_to,
            preferred_response_mode, authority_id } = req.body;

    const existing = await db.query(
      `SELECT * FROM rti_requests WHERE id=$1 AND citizen_id=$2 AND status='draft'`,
      [id, req.user.id]
    );
    if (!existing.rows[0]) return next(new AppError('Draft not found or already submitted.', 404));

    const { rows } = await db.query(
      `UPDATE rti_requests SET subject=$1, description=$2, information_sought=$3,
        period_from=$4, period_to=$5, preferred_response_mode=$6, authority_id=$7, updated_at=NOW()
       WHERE id=$8 AND citizen_id=$9 RETURNING *`,
      [subject, description, information_sought, period_from || null, period_to || null,
       preferred_response_mode, authority_id, id, req.user.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

// POST /api/requests/:id/submit — submit draft → payment_pending or submitted (BPL)
const submitRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT r.*, u.full_name, u.email, pa.name AS authority_name
       FROM rti_requests r
       JOIN users u ON r.citizen_id = u.id
       JOIN public_authorities pa ON r.authority_id = pa.id
       WHERE r.id=$1 AND r.citizen_id=$2 AND r.status='draft'`,
      [id, req.user.id]
    );
    if (!rows[0]) return next(new AppError('Draft not found.', 404));
    const request = rows[0];

    const newStatus = request.is_bpl ? 'submitted' : 'payment_pending';
    const { rows: updated } = await db.query(
      `UPDATE rti_requests SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [newStatus, id]
    );

    await log('rti_request', id, 'SUBMIT', req.user.id, { status: 'draft' }, { status: newStatus }, req);

    if (request.is_bpl) {
      // Trigger reg number generation for BPL (no payment needed)
      await db.query(
        `UPDATE rti_requests SET status='submitted' WHERE id=$1`,
        [id]
      );
      try {
        await sendSubmissionConfirmation(
          request.email, request.full_name,
          updated[0].registration_number, request.authority_name,
          updated[0].deadline_date
        );
      } catch (emailErr) {
        ignoreNonCriticalEmailFailure(emailErr, 'Submission confirmation email');
      }
      await createNotification(req.user.id, 'Application Submitted', `Your application has been submitted. Ref: ${updated[0].registration_number}`, 'rti_request', id);
    }

    res.json({ success: true, message: newStatus === 'payment_pending' ? 'Please complete payment.' : 'Application submitted.', data: updated[0] });
  } catch (err) { next(err); }
};

// GET /api/requests — list citizen's requests
const listRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    let conditions = ['r.citizen_id = $1'];
    let params = [req.user.id];
    let i = 2;
    if (status) { conditions.push(`r.status = $${i++}`); params.push(status); }

    const { rows } = await db.query(
      `SELECT r.id, r.registration_number, r.subject, r.status, r.created_at,
              r.deadline_date, r.submitted_at, pa.name AS authority_name
       FROM rti_requests r
       JOIN public_authorities pa ON r.authority_id = pa.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY r.created_at DESC LIMIT $${i++} OFFSET $${i}`,
      [...params, limit, offset]
    );
    const { rows: total } = await db.query(
      `SELECT COUNT(*) FROM rti_requests r WHERE ${conditions.join(' AND ')}`,
      [req.user.id, ...(status ? [status] : [])]
    );

    res.json({ success: true, data: rows, pagination: { total: parseInt(total[0].count), page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
};

// GET /api/requests/:id — get single request
const getRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT r.*, pa.name AS authority_name, pa.city, pa.state, pa.cpio_name, pa.cpio_email,
              u.full_name AS citizen_name, u.email AS citizen_email
       FROM rti_requests r
       JOIN public_authorities pa ON r.authority_id = pa.id
       JOIN users u ON r.citizen_id = u.id
       WHERE r.id=$1`,
      [id]
    );
    if (!rows[0]) return next(new AppError('Application not found.', 404));

    // Only owner or assigned staff can view
    const req_data = rows[0];
    if (req.user.role === 'citizen' && req_data.citizen_id !== req.user.id)
      return next(new AppError('Access denied.', 403));

    // Attachments
    const { rows: attachments } = await db.query(
      `SELECT id, file_name, file_size, mime_type, is_response_doc, created_at FROM request_attachments WHERE request_id=$1`,
      [id]
    );

    // Payments
    const { rows: payments } = await db.query(
      `SELECT id, amount, status, mode, receipt_number, created_at FROM payments WHERE request_id=$1`,
      [id]
    );

    // Timeline from audit log
    const { rows: timeline } = await db.query(
      `SELECT action, created_at, actor_id FROM audit_log WHERE entity_type='rti_request' AND entity_id=$1 ORDER BY created_at ASC`,
      [id]
    );

    res.json({ success: true, data: { ...req_data, attachments, payments, timeline } });
  } catch (err) { next(err); }
};

// GET /api/requests/:id/status — lightweight status check
const getStatus = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT registration_number, status, deadline_date, submitted_at, response_date
       FROM rti_requests WHERE id=$1 AND citizen_id=$2`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return next(new AppError('Not found.', 404));
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

// Public status tracker by reg number
const trackByRegNumber = async (req, res, next) => {
  try {
    const { reg_number } = req.params;
    const { rows } = await db.query(
      `SELECT r.registration_number, r.subject, r.status, r.submitted_at,
              r.deadline_date, r.response_date, pa.name AS authority_name
       FROM rti_requests r
       JOIN public_authorities pa ON r.authority_id = pa.id
       WHERE r.registration_number = $1`,
      [reg_number]
    );
    if (!rows[0]) return next(new AppError('Application not found.', 404));
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

module.exports = { createRequest, updateRequest, submitRequest, listRequests, getRequest, getStatus, trackByRegNumber };
