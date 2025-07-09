const express = require('express');
const router = express.Router();
const {auth} = require('../middleware/authMiddleware');
const { getMyNotifications, markAsRead } = require('../controllers/notification.controller');

router.get('/', auth, getMyNotifications);
router.patch('/:id/read', auth, markAsRead);

module.exports = router;
