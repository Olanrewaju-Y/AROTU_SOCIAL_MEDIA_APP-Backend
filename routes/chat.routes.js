const express = require('express');
const router = express.Router();
const {auth, admin} = require('../middleware/authMiddleware');
const {
  getPrivateMessages,
  sendMessage,
  recentConversations
} = require('../controllers/chat.controller');

router.post('/private', auth, sendMessage);
router.post('/recent-conversations', auth, recentConversations);

router.get('/private/:userId', auth, getPrivateMessages);



module.exports = router;
