const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/daily', reportsController.getDailyReport);
router.get('/month-to-date', reportsController.getMonthToDateReport);
router.get('/monthly', reportsController.getMonthlyReport);

module.exports = router;
