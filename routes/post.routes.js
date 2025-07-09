const express = require('express');
const router = express.Router();
const {auth} = require('../middleware/authMiddleware');
const {
  createPost,
  getFeed,
  toggleLike,
  addComment,
  getPostById
} = require('../controllers/post.controller');

router.post('/', auth, createPost);
router.get('/', auth, getFeed);
router.get('/:id', auth, getPostById);
router.patch('/:id/like', auth, toggleLike);
router.post('/:id/comment', auth, addComment);

module.exports = router;
