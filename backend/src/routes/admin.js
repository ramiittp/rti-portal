const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate, authorize('nodal_officer', 'cpio', 'faa', 'super_admin'));

router.get('/requests', ctrl.listAdminRequests);
router.get('/analytics', authorize('super_admin'), ctrl.getAnalytics);

router.put('/requests/:id/assign', authorize('nodal_officer', 'super_admin'),
  [body('cpio_id').isUUID()], validate, ctrl.assignCpio);

router.put('/requests/:id/reply', authorize('cpio', 'super_admin'),
  [body('response_text').notEmpty()], validate, ctrl.replyRequest);

router.put('/requests/:id/transfer', authorize('cpio', 'nodal_officer', 'super_admin'),
  [body('to_authority_id').isUUID(), body('reason').notEmpty()], validate, ctrl.transferRequest);

router.post('/requests/:id/additional-fee', authorize('cpio', 'super_admin'),
  [body('amount').isFloat({ min: 1 }), body('reason').notEmpty(), body('deadline').isDate()],
  validate, ctrl.raiseAdditionalFee);

module.exports = router;
