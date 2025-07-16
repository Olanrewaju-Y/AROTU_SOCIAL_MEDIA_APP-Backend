const express = require('express');
const router = express.Router();
const {auth, admin} = require('../middleware/authMiddleware');
const {
  getPrivateMessages,
  sendMessage
} = require('../controllers/chat.controller');

router.get('/private/:userId', auth, getPrivateMessages);
router.post('/private', auth, sendMessage);


module.exports = router;
