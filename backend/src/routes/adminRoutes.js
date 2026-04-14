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