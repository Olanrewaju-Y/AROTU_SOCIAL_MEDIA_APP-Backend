const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const {
  getProfile,
  updateProfile,
  blockUser,
  searchUsers
} = require('../controllers/user.controller');

router.get('/me', auth, getProfile);
router.put('/me', auth, updateProfile);
router.patch('/block/:id', auth, blockUser);
router.get('/search', auth, searchUsers);

module.exports = router;
