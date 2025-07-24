const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const {
  createPost,
  getMyPosts,
  getFriendsPosts,
  editPostSettings,
  getFriendsFeed,
  getAllPosts,
  deletePost,
  toggleLike,
  addComment,
  getPostById,
  getPostsByHashtag,
  searchPosts,
  bookmarkPost,
  getBookmarks,
  unbookmarkPost,
  getComments,
  deleteComment,
  repost,
} = require('../controllers/post.controller');

// Static routes — must come BEFORE dynamic `/:id`
router.get('/all-posts', getAllPosts);
router.get('/my-posts', auth, getMyPosts);
router.get('/friends-posts', auth, getFriendsPosts);
router.get('/friends-feed', auth, getFriendsFeed);
router.get('/search', auth, searchPosts);
router.get('/bookmarks', auth, getBookmarks);
router.get('/hashtag/:hashtag', auth, getPostsByHashtag);

// Create and repost
router.post('/', auth, createPost);
router.post('/:id/repost', auth, repost);

// Post settings
router.put('/:id/settings', auth, editPostSettings);
router.delete('/:id', auth, deletePost);

// Likes
router.patch('/:id/like', auth, toggleLike);

// Bookmarks
router.post('/:id/bookmark', auth, bookmarkPost);
router.delete('/:id/bookmark', auth, unbookmarkPost);

// Comments
router.post('/:id/comment', auth, addComment);
router.get('/:id/comments', auth, getComments);
router.delete('/:id/comment/:commentId', auth, deleteComment);

// Dynamic route at the end
router.get('/:id', auth, getPostById);

module.exports = router;
