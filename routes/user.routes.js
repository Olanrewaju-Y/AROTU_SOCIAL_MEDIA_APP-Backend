const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware'); // Your authentication middleware
const {
  getProfile,
  getUserById,
  updateProfile,
  getAllUsers,
  deleteAccount,
  blockUser,
  searchUsers,
  getFriendsList,
  unfriendUser,
  followUser,
  unfollowUser,
  getFollowingList,
  getFollowersList,
  updateSettings,
  getSettings,
  getActivityLog,
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  clearAllNotifications,
  getUserStatistics,
  getFeelings,
  updateFeelings,
   // NEW IMPORTS FOR SPECIFIC USER LISTS
  getFollowingListForUser,
  getFollowersListForUser,
  getFriendsListForUser,
} = require('../controllers/user.controller');

// =======================================================
// Public Routes (No authentication required)
// =======================================================

// Get all users (e.g., for a user directory)
router.get('/', getAllUsers);

// Search users by query
router.get('/search', searchUsers);

// Get a specific user's public profile by ID
router.get('/:id', getUserById);


// =======================================================
// Private Routes (Authentication required)
// =======================================================

// Authenticated user's own profile
router.get('/me', auth, getProfile);
router.put('/me', auth, updateProfile);
router.delete('/me', auth, deleteAccount); // Delete authenticated user's own account

// Feelings
router.get('/feelings', auth, getFeelings);
router.put('/feelings', auth, updateFeelings);

// Following and Followers lists for the authenticated user
router.get('/following', auth, getFollowingList);
router.get('/followers', auth, getFollowersList);

// Friendship management for the authenticated user
router.get('/friends', auth, getFriendsList);
router.delete('/friends/:id', auth, unfriendUser); // Unfriend a specific user

// Settings
router.put('/settings', auth, updateSettings);
router.get('/settings', auth, getSettings);

// Activity Log
router.get('/activity-log', auth, getActivityLog);

// User statistics
router.get('/statistics', auth, getUserStatistics);

// Notifications
router.get('/notifications', auth, getNotifications);
router.post('/notifications/:id/read', auth, markNotificationAsRead);
router.delete('/notifications/:id', auth, deleteNotification);
router.delete('/notifications/clear', auth, clearAllNotifications);

// Actions on other users (require authentication)
router.patch('/block/:id', auth, blockUser); // Block a specific user

// Following/Unfollowing other users
router.post('/:id/follow', auth, followUser);
router.post('/:id/unfollow', auth, unfollowUser);

// NEW ROUTES FOR FETCHING LISTS OF A SPECIFIC USER (by ID in URL)
router.get('/:id/following', auth, getFollowingListForUser);
router.get('/:id/followers', auth, getFollowersListForUser);
router.get('/:id/friends', auth, getFriendsListForUser);



module.exports = router;