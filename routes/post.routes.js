const express = require('express');
const router = express.Router();
const {auth} = require('../middleware/authMiddleware');
const {
  createPost,
  getMyPosts,
  getFriendsPosts,
  editPostSettings,
  getFriendsFeed,
  getAllPosts,
  updatePost,
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
  repost
} = require('../controllers/post.controller');


// Routers
router.post('/', auth, createPost);
router.get('/:id', auth, getPostById);
router.get('/my-posts', auth, getMyPosts);
router.get('/friends-posts', auth, getFriendsPosts);
router.put('/:id/settings', auth, editPostSettings);
router.get('/friends-feed', auth, getFriendsFeed);
router.get('/all-posts', getAllPosts);
router.put('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);
router.get('/search', auth, searchPosts);
router.post('/:id/repost', auth, repost);
router.get('/hashtag/:hashtag', auth, getPostsByHashtag);

// Like and unlike a post
router.patch('/:id/like', auth, toggleLike);

// Bookmarking routers
router.post('/:id/bookmark', auth, bookmarkPost);
router.get('/bookmarks', auth, getBookmarks);
router.delete('/:id/bookmark', auth, unbookmarkPost);

// Comments routers
router.post('/:id/comment', auth, addComment);
router.get('/:id/comments', auth, getComments);
router.delete('/:id/comment/:commentId', auth, deleteComment);







module.exports = router;
