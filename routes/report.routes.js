const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  reportUser,
  getReports,
  reviewReport
} = require('../controllers/report.controller');

router.post('/', auth, reportUser);
router.get('/', auth, getReports);         // admin only
router.patch('/:id/review', auth, reviewReport); // admin only

module.exports = router;
