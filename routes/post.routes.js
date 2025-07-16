const express = require('express');
const router = express.Router();
const {auth} = require('../middleware/authMiddleware');
const {
  createPost,
  getFriendsFeed,
  getAllPosts,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
  getPostById
} = require('../controllers/post.controller');

router.post('/', auth, createPost);
router.get('/', auth, getFriendsFeed);
router.get('/all-posts', getAllPosts);
router.get('/:id', auth, getPostById);
router.put('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);
router.patch('/:id/like', auth, toggleLike);
router.post('/:id/comment', auth, addComment);

module.exports = router;
