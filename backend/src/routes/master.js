const router = require('express').Router();
const ctrl = require('../controllers/masterController');
router.get('/ministries', ctrl.getMinistries);
router.get('/departments', ctrl.getDepartments);
router.get('/authorities', ctrl.searchAuthorities);
router.get('/templates', ctrl.getTemplates);
router.post('/templates/:id/use', ctrl.useTemplate);
module.exports = router;
