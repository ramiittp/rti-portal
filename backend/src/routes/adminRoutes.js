const express = require('express');
const router = express.Router();
const db = require('../config/database');

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
const { v4: uuidv4 } = require('uuid');
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

module.exports = router;





// const express = require('express');
// const { authRequired } = require('../middleware/auth.js');

// const router = express.Router();

// router.use(authRequired);

// router.get('/requests', (req, res) => {
//   const demo = [
//     {
//       id: 'demo-1',
//       registration_number: 'RTI/2026/000001',
//       subject: 'Demo RTI about hostel facilities',
//       status: 'under_process',
//     },
//   ];
//   res.json({ data: demo });
// });

// module.exports = router;