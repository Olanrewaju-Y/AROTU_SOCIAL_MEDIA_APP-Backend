const express = require('express');
const router = express.Router();
const {auth, admin} = require('../middleware/authMiddleware');
const {
  getPrivateMessages,
  sendMessage,
  createPrivateMessage,
  recentConversations
} = require('../controllers/message.controller');

router.post('/private', auth, sendMessage);
router.post('/createPrivate', auth, createPrivateMessage);
router.get('/recent-conversations', auth, recentConversations);
// Get private messages between two users
router.get('/private/:userId', auth, getPrivateMessages);



module.exports = router;
