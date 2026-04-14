const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Comment this out for now
// const { authenticate } = require('../middleware/auth');
// router.use(authenticate); // remove or comment while testing

router.get('/requests', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT r.id, r.registration_number, r.subject, r.status, r.submitted_at,
             r.deadline_date, u.full_name AS citizen_name, u.email AS citizen_email,
             pa.name AS authority_name
      FROM rti_requests r 
      LEFT JOIN users u ON r.citizen_id = u.id
      LEFT JOIN public_authorities pa ON r.authority_id = pa.id
      ORDER BY r.submitted_at DESC NULLS LAST
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching requests:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

router.get('/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT r.*, pa.name AS authority_name, pa.city, pa.state, pa.cpio_name, pa.cpio_email,
              u.full_name AS citizen_name, u.email AS citizen_email
       FROM rti_requests r
       LEFT JOIN public_authorities pa ON r.authority_id = pa.id
       LEFT JOIN users u ON r.citizen_id = u.id
       WHERE r.id = $1`,
      [id]
    );

    if (!rows[0]) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const req_data = rows[0];

    // Attachments
    const { rows: attachments } = await db.query(
      `SELECT id, file_name, file_size, mime_type, is_response_doc, created_at FROM request_attachments WHERE request_id = $1`,
      [id]
    );

    // Payments
    const { rows: payments } = await db.query(
      `SELECT id, amount, status, mode, receipt_number, created_at FROM payments WHERE request_id = $1`,
      [id]
    );

    // Timeline from audit log
    const { rows: timeline } = await db.query(
      `SELECT action, created_at, actor_id FROM audit_log WHERE entity_type='rti_request' AND entity_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    res.json({ success: true, data: { ...req_data, attachments, payments, timeline } });
  } catch (err) {
    console.error('Error fetching request details:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Update Processing status
router.put('/requests/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    const { rows } = await db.query(
      `UPDATE rti_requests SET status = $1, rejection_reason = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [status, rejection_reason || null, id]
    );

    if (!rows[0]) return res.status(404).json({ success: false, message: 'Request not found' });
    res.json({ success: true, data: rows[0], message: 'Status updated successfully' });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Draft and send response
router.put('/requests/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { response_text } = req.body;

    const { rows } = await db.query(
      `UPDATE rti_requests SET response_text = $1, response_date = NOW(), status = 'replied', updated_at = NOW() WHERE id = $2 RETURNING *`,
      [response_text, id]
    );

    if (!rows[0]) return res.status(404).json({ success: false, message: 'Request not found' });
    res.json({ success: true, data: rows[0], message: 'Response drafted and sent' });
  } catch (err) {
    console.error('Error sending response:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Manage deadlines
router.put('/requests/:id/deadline', async (req, res) => {
  try {
    const { id } = req.params;
    const { extended_deadline, extension_reason } = req.body;

    const { rows } = await db.query(
      `UPDATE rti_requests SET extended_deadline = $1, extension_reason = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [extended_deadline, extension_reason, id]
    );

    if (!rows[0]) return res.status(404).json({ success: false, message: 'Request not found' });
    res.json({ success: true, data: rows[0], message: 'Deadline updated successfully' });
  } catch (err) {
    console.error('Error updating deadline:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Internal notes / comments
router.post('/requests/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { note_text } = req.body;

    const { rows } = await db.query(
      `INSERT INTO audit_log (id, entity_type, entity_id, action, new_value, created_at)
       VALUES ($1, 'rti_request', $2, 'INTERNAL_NOTE', $3, NOW()) RETURNING *`,
      [uuidv4(), id, JSON.stringify({ note: note_text })]
    );

    res.json({ success: true, data: rows[0], message: 'Internal note added' });
  } catch (err) {
    console.error('Error adding internal note:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Set Quality Score
router.put('/requests/:id/quality', async (req, res) => {
  try {
    const { id } = req.params;
    const { quality_score } = req.body;

    const { rows } = await db.query(
      `UPDATE rti_requests SET quality_score = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [quality_score, id]
    );

    if (!rows[0]) return res.status(404).json({ success: false, message: 'Request not found' });
    res.json({ success: true, data: rows[0], message: 'Quality score updated' });
  } catch (err) {
    console.error('Error updating quality score:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET /api/admin/authorities — list all active authorities (for transfer dropdown)
router.get('/authorities', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, city, state, cpio_name, cpio_email FROM public_authorities WHERE is_active = true ORDER BY name ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching authorities:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET /api/admin/cpios — list users with role cpio (for assign dropdown)
router.get('/cpios', async (req, res) => {
  try {
    const { authority_id } = req.query;
    const params = [];
    let where = `WHERE role = 'cpio' AND is_active = true`;
    if (authority_id) {
      where += ` AND authority_id = $1`;
      params.push(authority_id);
    }
    const { rows } = await db.query(
      `SELECT id, full_name, email, authority_id FROM users ${where} ORDER BY full_name ASC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching CPIOs:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// PUT /api/admin/requests/:id/assign — Nodal Officer assigns to CPIO
router.put('/requests/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { cpio_id } = req.body;
    if (!cpio_id) return res.status(400).json({ success: false, message: 'cpio_id is required' });

    const { rows } = await db.query(
      `UPDATE rti_requests SET assigned_cpio_id = $1, status = 'assigned', updated_at = NOW() WHERE id = $2 RETURNING *`,
      [cpio_id, id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Request not found' });

    // Record in audit log
    await db.query(
      `INSERT INTO audit_log (id, entity_type, entity_id, action, new_value, created_at) VALUES ($1,'rti_request',$2,'ASSIGN_CPIO',$3,NOW())`,
      [uuidv4(), id, JSON.stringify({ cpio_id })]
    );

    res.json({ success: true, data: rows[0], message: 'Request assigned to CPIO' });
  } catch (err) {
    console.error('Error assigning CPIO:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// PUT /api/admin/requests/:id/transfer — Transfer to another authority
router.put('/requests/:id/transfer', async (req, res) => {
  try {
    const { id } = req.params;
    const { to_authority_id, reason } = req.body;
    if (!to_authority_id || !reason)
      return res.status(400).json({ success: false, message: 'to_authority_id and reason are required' });

    const { rows: reqRows } = await db.query(`SELECT * FROM rti_requests WHERE id = $1`, [id]);
    if (!reqRows[0]) return res.status(404).json({ success: false, message: 'Request not found' });
    if (reqRows[0].transfer_count >= 1)
      return res.status(400).json({ success: false, message: 'RTI Act allows only one transfer per request' });

    // Record transfer
    await db.query(
      `INSERT INTO request_transfers (id, request_id, from_authority_id, to_authority_id, reason, transferred_at) VALUES ($1,$2,$3,$4,$5,NOW())`,
      [uuidv4(), id, reqRows[0].authority_id, to_authority_id, reason]
    );

    // Update request
    const { rows } = await db.query(
      `UPDATE rti_requests SET authority_id = $1, status = 'transferred', transfer_count = transfer_count + 1,
       deadline_date = (NOW() + INTERVAL '30 days')::DATE, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [to_authority_id, id]
    );

    await db.query(
      `INSERT INTO audit_log (id, entity_type, entity_id, action, old_value, new_value, created_at) VALUES ($1,'rti_request',$2,'TRANSFER',$3,$4,NOW())`,
      [uuidv4(), id, JSON.stringify({ authority_id: reqRows[0].authority_id }), JSON.stringify({ authority_id: to_authority_id, reason })]
    );

    res.json({ success: true, data: rows[0], message: 'Request transferred successfully' });
  } catch (err) {
    console.error('Error transferring request:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// POST /api/admin/requests/:id/additional-fee — Raise additional fee request
router.post('/requests/:id/additional-fee', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason, deadline } = req.body;
    if (!amount || !reason || !deadline)
      return res.status(400).json({ success: false, message: 'amount, reason, and deadline are required' });

    const { rows: reqRows } = await db.query(`SELECT * FROM rti_requests WHERE id = $1`, [id]);
    if (!reqRows[0]) return res.status(404).json({ success: false, message: 'Request not found' });

    const { rows } = await db.query(
      `INSERT INTO additional_fee_requests (id, request_id, amount, reason, deadline) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [uuidv4(), id, amount, reason, deadline]
    );

    await db.query(
      `UPDATE rti_requests SET status = 'additional_fee_pending', updated_at = NOW() WHERE id = $1`,
      [id]
    );

    await db.query(
      `INSERT INTO audit_log (id, entity_type, entity_id, action, new_value, created_at) VALUES ($1,'rti_request',$2,'ADDITIONAL_FEE_RAISED',$3,NOW())`,
      [uuidv4(), id, JSON.stringify({ amount, reason, deadline })]
    );

    res.json({ success: true, data: rows[0], message: 'Additional fee request raised' });
  } catch (err) {
    console.error('Error raising additional fee:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;