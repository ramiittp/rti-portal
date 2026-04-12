const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/requestController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: process.env.UPLOAD_DIR || './uploads',
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword',
                     'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.use(authenticate);

router.get('/track/:reg_number', ctrl.trackByRegNumber);

router.post('/',
  [body('authority_id').isUUID(), body('subject').notEmpty().isLength({ max: 500 }),
   body('description').notEmpty(), body('information_sought').notEmpty()],
  validate, ctrl.createRequest);

router.put('/:id',
  [body('subject').optional().isLength({ max: 500 })],
  validate, ctrl.updateRequest);

router.post('/:id/submit', ctrl.submitRequest);
router.get('/', ctrl.listRequests);
router.get('/:id', ctrl.getRequest);
router.get('/:id/status', ctrl.getStatus);

module.exports = router;
