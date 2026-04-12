const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { log } = require('../services/auditService');
const { create: createNotification } = require('../services/notificationService');
const { AppError } = require('../middleware/errorHandler');

// POST /api/appeals
const fileAppeal = async (req, res, next) => {
  try {
    const { request_id, type, grounds, relief_sought } = req.body;

    const { rows: reqRows } = await db.query(
      `SELECT r.*, pa.faa_email FROM rti_requests r
       JOIN public_authorities pa ON r.authority_id = pa.id
       WHERE r.id=$1 AND r.citizen_id=$2`,
      [request_id, req.user.id]
    );
    if (!reqRows[0]) return next(new AppError('RTI request not found.', 404));
    const request = reqRows[0];

    // Business rules
    if (type === 'first_appeal' && !['replied', 'rejected', 'closed'].includes(request.status)) {
      // Allow if 30 days elapsed without response
      const daysSinceSubmit = (Date.now() - new Date(request.submitted_at)) / (1000 * 60 * 60 * 24);
      if (daysSinceSubmit < 30) return next(new AppError('First appeal can only be filed after 30 days of no response or after receiving a reply.', 400));
    }

    const { rows } = await db.query(
      `INSERT INTO appeals (id, request_id, appellant_id, authority_id, type, grounds, relief_sought)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [uuidv4(), request_id, req.user.id, request.authority_id, type, grounds, relief_sought]
    );

    await log('appeal', rows[0].id, 'FILED', req.user.id, null, rows[0], req);
    await createNotification(req.user.id, 'Appeal Filed', `Your ${type.replace('_', ' ')} has been filed. Ref: ${rows[0].registration_number}`, 'appeal', rows[0].id);

    res.status(201).json({ success: true, message: 'Appeal filed successfully.', data: rows[0] });
  } catch (err) { next(err); }
};

// GET /api/appeals
const listAppeals = async (req, res, next) => {
  try {
    let query, params;
    if (req.user.role === 'citizen') {
      query = `SELECT a.*, r.subject, r.registration_number AS request_reg_no, pa.name AS authority_name
               FROM appeals a JOIN rti_requests r ON a.request_id=r.id
               JOIN public_authorities pa ON a.authority_id=pa.id
               WHERE a.appellant_id=$1 ORDER BY a.created_at DESC`;
      params = [req.user.id];
    } else if (req.user.role === 'faa') {
      query = `SELECT a.*, r.subject, r.registration_number AS request_reg_no, pa.name AS authority_name,
                      u.full_name AS appellant_name, u.email AS appellant_email
               FROM appeals a JOIN rti_requests r ON a.request_id=r.id
               JOIN public_authorities pa ON a.authority_id=pa.id
               JOIN users u ON a.appellant_id=u.id
               WHERE a.authority_id=$1 ORDER BY a.created_at DESC`;
      params = [req.user.authority_id];
    } else {
      query = `SELECT a.*, r.subject, pa.name AS authority_name, u.full_name AS appellant_name
               FROM appeals a JOIN rti_requests r ON a.request_id=r.id
               JOIN public_authorities pa ON a.authority_id=pa.id
               JOIN users u ON a.appellant_id=u.id
               ORDER BY a.created_at DESC LIMIT 100`;
      params = [];
    }
    const { rows } = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// GET /api/appeals/:id
const getAppeal = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT a.*, r.subject, r.registration_number AS req_reg_no, r.information_sought,
              pa.name AS authority_name, u.full_name AS appellant_name, u.email AS appellant_email
       FROM appeals a JOIN rti_requests r ON a.request_id=r.id
       JOIN public_authorities pa ON a.authority_id=pa.id
       JOIN users u ON a.appellant_id=u.id
       WHERE a.id=$1`,
      [req.params.id]
    );
    if (!rows[0]) return next(new AppError('Appeal not found.', 404));
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

// PUT /api/appeals/:id/dispose — FAA only
const disposeAppeal = async (req, res, next) => {
  try {
    const { order_text, status } = req.body;
    const { rows } = await db.query(
      `UPDATE appeals SET status=$1, order_text=$2, order_date=NOW(), updated_at=NOW()
       WHERE id=$3 AND assigned_faa_id=$4 RETURNING *`,
      [status, order_text, req.params.id, req.user.id]
    );
    if (!rows[0]) return next(new AppError('Appeal not found or not assigned to you.', 404));
    await log('appeal', req.params.id, 'DISPOSE', req.user.id, null, { status, order_text }, req);
    res.json({ success: true, message: 'Appeal disposed.', data: rows[0] });
  } catch (err) { next(err); }
};

module.exports = { fileAppeal, listAppeals, getAppeal, disposeAppeal };
