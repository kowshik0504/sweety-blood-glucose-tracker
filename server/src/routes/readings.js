const express = require('express');
const router = express.Router();
const readingsController = require('../controllers/readingsController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', readingsController.getReadings);
router.post('/', readingsController.addReading);
router.put('/:id', readingsController.updateReading);
router.delete('/:id', readingsController.deleteReading);

module.exports = router;
