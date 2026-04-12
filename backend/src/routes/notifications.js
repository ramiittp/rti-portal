const router = require('express').Router();
const ctrl = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);
router.get('/', ctrl.list);
router.put('/:id/read', ctrl.readOne);
router.put('/read-all', ctrl.readAll);
module.exports = router;
