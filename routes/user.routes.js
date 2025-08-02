const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const {
  getProfile,
  getUserById,
  updateProfile,
  getAllUsers,
  deleteAccount,
  blockUser,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendsList,
  getFriendRequests,
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

} = require('../controllers/user.controller');


// User routes
router.get('/me', auth, getProfile);
router.put('/me', auth, updateProfile);
router.get('/', auth, getAllUsers);
router.delete('/me', auth, deleteAccount);
router.get('/search', auth, searchUsers);

router.get('/following', auth, getFollowingList);
router.get('/followers', auth, getFollowersList);

router.get('/friends', auth, getFriendsList);
router.get('/friend-requests', auth, getFriendRequests);
router.delete('/friends/:id', auth, unfriendUser);

// Settings
router.put('/settings', auth, updateSettings);
router.get('/settings', auth, getSettings);
router.get('/activity-log', auth, getActivityLog);

// User statistics
router.get('/statistics', auth, getUserStatistics);

router.get('/notifications', auth, getNotifications);
router.delete('/notifications/clear', auth, clearAllNotifications);

router.get('/:id', auth, getUserById);
router.patch('/block/:id', auth, blockUser);

// Friendship routes
router.post('/:id/friend-request', auth, sendFriendRequest);
router.post('/:id/friend-request/accept', auth, acceptFriendRequest);
router.post('/:id/friend-request/reject', auth, rejectFriendRequest);


// Following routes
router.post('/:id/follow', auth, followUser); // Changed to followUser
router.post('/:id/unfollow', auth, unfollowUser); // Changed to unfollowUser


// Notifications
router.post('/notifications/:id/read', auth, markNotificationAsRead);
router.delete('/notifications/:id', auth, deleteNotification);






module.exports = router;
