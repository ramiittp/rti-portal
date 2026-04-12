const router = require('express').Router();
const { body } = require('express-validator');
const { sendOtp, verifyOtp, getProfile, updateProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { otpLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');

router.post('/send-otp', otpLimiter,
  [body('email').isEmail().normalizeEmail(), body('name').optional().isLength({ min: 2, max: 100 })],
  validate, sendOtp);

router.post('/verify-otp',
  [body('email').isEmail().normalizeEmail(), body('otp').isLength({ min: 6, max: 6 }).isNumeric()],
  validate, verifyOtp);

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate,
  [body('full_name').notEmpty().isLength({ max: 200 }),
   body('phone').optional().isMobilePhone('en-IN'),
   body('pincode').optional().isLength({ min: 6, max: 6 })],
  validate, updateProfile);

module.exports = router;
