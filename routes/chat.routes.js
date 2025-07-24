const express = require('express');
const router = express.Router();
const {auth, admin} = require('../middleware/authMiddleware');
const {
  getPrivateMessages,
  sendMessage
} = require('../controllers/chat.controller');

router.post('/private', auth, sendMessage);
router.get('/private/:userId', auth, getPrivateMessages);



module.exports = router;
