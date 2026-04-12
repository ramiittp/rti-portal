const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/appealController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

router.post('/',
  [body('request_id').isUUID(), body('type').isIn(['first_appeal', 'second_appeal']),
   body('grounds').notEmpty().isLength({ max: 3000 }), body('relief_sought').notEmpty()],
  validate, ctrl.fileAppeal);

router.get('/', ctrl.listAppeals);
router.get('/:id', ctrl.getAppeal);

router.put('/:id/dispose', authorize('faa', 'super_admin'),
  [body('order_text').notEmpty(), body('status').isIn(['disposed', 'rejected'])],
  validate, ctrl.disposeAppeal);

module.exports = router;
