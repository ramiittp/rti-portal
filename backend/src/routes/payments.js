const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');

router.use(authenticate);

router.post('/create-order', paymentLimiter,
  [body('request_id').isUUID()], validate, ctrl.createPaymentOrder);

router.post('/verify',
  [body('payment_id').isUUID(), body('razorpay_payment_id').notEmpty(),
   body('razorpay_order_id').notEmpty(), body('razorpay_signature').notEmpty()],
  validate, ctrl.verifyPayment);

router.post('/offline',
  [body('request_id').isUUID(), body('mode').isIn(['ipl', 'dd', 'cash'])],
  validate, ctrl.offlinePayment);

router.get('/:request_id', ctrl.getPayments);

module.exports = router;
