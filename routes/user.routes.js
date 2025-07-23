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
  followFriend,
  unfollowFriend,
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
router.get('/:id', auth, getUserById);
router.put('/me', auth, updateProfile);
router.get('/', auth, getAllUsers);
router.delete('/me', auth, deleteAccount);
router.patch('/block/:id', auth, blockUser);
router.get('/search', auth, searchUsers);

// Friendship routes
router.post('/:id/friend-request', auth, sendFriendRequest);
router.post('/:id/friend-request/accept', auth, acceptFriendRequest);
router.post('/:id/friend-request/reject', auth, rejectFriendRequest);
router.get('/friends', auth, getFriendsList);
router.get('/friend-requests', auth, getFriendRequests);
router.delete('/friends/:id', auth, unfriendUser);

// Following routes
router.post('/:id/follow', auth, followFriend);
router.post('/:id/unfollow', auth, unfollowFriend);
router.get('/following', auth, getFollowingList);
router.get('/followers', auth, getFollowersList);

// Settings
router.put('/settings', auth, updateSettings);
router.get('/settings', auth, getSettings);
router.get('/activity-log', auth, getActivityLog);

// Notifications
router.get('/notifications', auth, getNotifications);
router.post('/notifications/:id/read', auth, markNotificationAsRead);
router.delete('/notifications/:id', auth, deleteNotification);
router.delete('/notifications/clear', auth, clearAllNotifications);

// User statistics
router.get('/statistics', auth, getUserStatistics);



module.exports = router;
