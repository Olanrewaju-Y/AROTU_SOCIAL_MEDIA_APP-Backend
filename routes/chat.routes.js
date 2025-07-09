const express = require('express');
const router = express.Router();
const {auth, admin} = require('../middleware/authMiddleware');
const {
  getPrivateMessages,
  sendMessage,
  getRoomMessages,
  createRoom,
  getMyRooms
} = require('../controllers/chat.controller');

router.get('/private/:userId', auth, getPrivateMessages);
router.post('/private', auth, sendMessage);

router.get('/room/:roomId', auth, getRoomMessages);
router.post('/room', auth, admin, createRoom);
router.get('/rooms', auth, getMyRooms);

module.exports = router;
