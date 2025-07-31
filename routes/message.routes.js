const express = require('express');
const router = express.Router();
const {auth, admin} = require('../middleware/authMiddleware');

// Destructure the correct function name from the controller
const {
  getPrivateMessages,
  createPrivateMessage, // <--- CHANGE THIS TO createPrivateMessage
  recentConversations
} = require('../controllers/message.controller'); // Make sure this path is correct

// Use the correct function in your route
router.post('/private', auth, createPrivateMessage); // <--- CHANGE THIS TO createPrivateMessage
router.get('/recent-conversations', auth, recentConversations);
router.get('/private/:userId', auth, getPrivateMessages);

module.exports = router;