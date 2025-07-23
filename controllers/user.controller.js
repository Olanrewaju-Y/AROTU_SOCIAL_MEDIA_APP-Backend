const express = require('express');
const User = require('../models/User');

// Get your profile
exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
};

// Update your profile
exports.updateProfile = async (req, res) => {
  const { bio, avatar, status } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { bio, avatar, status },
    { new: true }
  ).select('-password');
  res.json(user);
};

// Block a user
exports.blockUser = async (req, res) => {
  const { id: blockId } = req.params;
  const user = await User.findById(req.user.id);
  if (!user.blockedUsers.includes(blockId)) {
    user.blockedUsers.push(blockId);
    await user.save();
  }
  res.json({ message: 'User blocked' });
};

// Search users
exports.searchUsers = async (req, res) => {
  const query = req.query.q;
  const users = await User.find({
    username: { $regex: query, $options: 'i' }
  }).select('username avatar bio');
  res.json(users);
};

// Friend requests
exports.sendFriendRequest = async (req, res) => {
  const { id: targetUserId } = req.params;
  const user = await User.findById(req.user.id);
  if (!user.friendRequestsSent.includes(targetUserId)) {
    user.friendRequestsSent.push(targetUserId);
    await user.save();
  }
  res.json({ message: 'Friend request sent' });
};
// Accept friend request
exports.acceptFriendRequest = async (req, res) => {
  const { id: requestId } = req.params;
  const user = await User.findById(req.user.id);
  if (user.friendRequestsReceived.includes(requestId)) {
    user.friends.push(requestId);
    user.friendRequestsReceived = user.friendRequestsReceived.filter(
      (id) => id !== requestId
    );
    await user.save();
  }
  res.json({ message: 'Friend request accepted' });
};
// Reject friend request
exports.rejectFriendRequest = async (req, res) => {
  const { id: requestId } = req.params;
  const user = await User.findById(req.user.id);
  user.friendRequestsReceived = user.friendRequestsReceived.filter(
    (id) => id !== requestId
  );
  await user.save();
  res.json({ message: 'Friend request rejected' });
};
// Get friends list
exports.getFriendsList = async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('friends', 'username avatar bio');
  res.json(user.friends);
};
// Get friend requests
exports.getFriendRequests = async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('friendRequestsReceived', 'username avatar bio');
  res.json(user.friendRequestsReceived);
};
// Unfriend a user
exports.unfriendUser = async (req, res) => {
  const { id: friendId } = req.params;
  const user = await User.findById(req.user.id);
  user.friends = user.friends.filter((id) => id.toString() !== friendId);
  await user.save();
  res.json({ message: 'User unfriended' });
};
// Get user by ID
exports.getUserById = async (req, res) => {
  const { id: userId } = req.params;
  const user = await User.findById(userId).select('-password');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
};
// Follow friend
exports.followFriend = async (req, res) => {
  const { id: friendId } = req.params;
  const user = await User.findById(req.user.id);
  if (!user.following.includes(friendId)) {
    user.following.push(friendId);
    await user.save();
  }
  res.json({ message: 'User followed' });
};
// Unfollow friend
exports.unfollowFriend = async (req, res) => {
  const { id: friendId } = req.params;
  const user = await User.findById(req.user.id);
  user.following = user.following.filter((id) => id.toString() !== friendId);
  await user.save();
  res.json({ message: 'User unfollowed' });
};
// Get following list
exports.getFollowingList = async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('following', 'username avatar bio');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user.following);
};
// Get followers list
exports.getFollowersList = async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('followers', 'username avatar bio');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user.followers);
};

// Get all users
exports.getAllUsers = async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
};

// Delete user account
exports.deleteAccount = async (req, res) => {
  const user = await User.findByIdAndDelete(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json({ message: 'User account deleted' });
};

// Update user settings
exports.updateSettings = async (req, res) => {
  const { emailNotifications, privacySettings } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { emailNotifications, privacySettings },
    { new: true }
  ).select('-password');
  res.json(user);
};

// Get user settings
exports.getSettings = async (req, res) => {
  const user = await User.findById(req.user.id)
    .select('emailNotifications privacySettings');
  res.json(user);
};

// Get user activity log
exports.getActivityLog = async (req, res) => {
  const user = await User.findById(req.user.id)
    .select('activityLog');
  res.json(user.activityLog);
};

// Get user notifications
exports.getNotifications = async (req, res) => {
const user = await User.findById(req.user.id)
    .select('notifications');
  res.json(user.notifications);
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  const { notificationId } = req.params;
  const user = await User.findById(req.user.id);
  const notification = user.notifications.id(notificationId);
  if (notification) {
    notification.read = true;
    await user.save();
    res.json({ message: 'Notification marked as read' });
  } else {
    res.status(404).json({ message: 'Notification not found' });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  const { notificationId } = req.params;
  const user = await User.findById(req.user.id);
  user.notifications.id(notificationId).remove();
  await user.save();
  res.json({ message: 'Notification deleted' });
};
// Clear all notifications
exports.clearAllNotifications = async (req, res) => {
  const user = await User.findById(req.user.id);
  user.notifications = [];
  await user.save();
  res.json({ message: 'All notifications cleared' });
};

// Get user statistics
exports.getUserStatistics = async (req, res) => {
  const user = await User.findById(req.user.id)
    .select('friends followers following activityLog notifications');
  res.json({
    totalFriends: user.friends.length,
    totalFollowers: user.followers.length,
    totalFollowing: user.following.length,
    totalActivity: user.activityLog.length,
    totalNotifications: user.notifications.length
  });
};