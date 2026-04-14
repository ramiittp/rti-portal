const express = require('express');
const router = express.Router();

// Comment this out for now
// const { authenticate } = require('../middleware/auth');
// router.use(authenticate); // remove or comment while testing

router.get('/requests', (req, res) => {
  const demo = [
    {
      id: 'demo-1',
      registration_number: 'RTI/2026/000001',
      subject: 'Demo RTI about hostel facilities',
      citizen_name: 'Demo User',
      status: 'UNDER_PROCESS',
    },
  ];
  res.json({ data: demo });
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