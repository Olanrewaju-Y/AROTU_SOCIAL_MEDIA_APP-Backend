const express = require('express');
const router = express.Router();
const {auth, admin} = require('../middleware/authMiddleware');
const {
  getPrivateMessages,
  createPrivateMessage,
//  sendMessage,
  recentConversations,
  getUsersInConversation
} = require('../controllers/message.controller');

//  router.post('/private', auth, sendMessage);
 router.post('/create-private', auth, createPrivateMessage);
router.get('/in-conversation', auth, getUsersInConversation);
router.get('/recent-conversations', auth, recentConversations);
// Get private messages between two users
router.get('/private/:userId', auth, getPrivateMessages);



module.exports = router;
