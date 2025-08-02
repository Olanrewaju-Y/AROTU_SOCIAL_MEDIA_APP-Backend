const express = require('express');
const User = require('../models/User');

// Get your profile
exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
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

// Update your profile
exports.updateProfile = async (req, res) => {
  const { phone, birthday, gender, location, relationshipStatus, lookingFor, roomNickname, avatar, bio, status } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { phone, birthday, gender, location, relationshipStatus, lookingFor, roomNickname, avatar, bio, status },
    { new: true }
  ).select('-password');
  res.json(user);
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
  const queryTerm = req.query.q; // The search term from the frontend

  if (!queryTerm) {
    return res.status(400).json({ message: "Search query 'q' is required." });
  }

  try {
    // Use $or to search across multiple fields: username, roomNickname, or phone
    // $regex provides pattern matching, and $options: 'i' makes the search case-insensitive.
    const users = await User.find({
      $or: [
        { username: { $regex: queryTerm, $options: 'i' } },
        { roomNickname: { $regex: queryTerm, $options: 'i' } },
        { phone: { $regex: queryTerm, $options: 'i' } } // Changed from phoneNo to phone
      ]
    }).select('username roomNickname phone avatar bio _id status gender lookingFor relationshipStatus'); // Select relevant fields, including _id and updated phone field

    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Internal server error during user search." });
  }
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


// Follow a user
// In your backend controller for followUser
exports.followUser = async (req, res) => {
  try {
    const userToFollowId = req.params.id;
    const currentUserId = req.user.id; // Assuming req.user.id is populated by auth middleware

    console.log(`[Follow API] Request: currentUserId=${currentUserId}, userToFollowId=${userToFollowId}`);

    if (userToFollowId === currentUserId) {
      console.log('[Follow API] Attempted to follow self.');
      return res.status(400).json({ message: 'You cannot follow yourself.' });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      console.error('[Follow API] Authenticated user not found for ID:', currentUserId);
      return res.status(404).json({ message: 'Authenticated user not found.' });
    }
    console.log(`[Follow API] Current user fetched: ${currentUser.username}, Following array:`, currentUser.following);

    // Crucial check: Ensure 'following' exists before pushing
    if (!currentUser.following) {
        console.warn(`[Follow API] 'following' array is missing for user ${currentUser.username}. Initializing.`);
        currentUser.following = [];
    }

    if (!currentUser.following.includes(userToFollowId)) {
      currentUser.following.push(userToFollowId);
      console.log(`[Follow API] Pushed ${userToFollowId} to ${currentUser.username}'s following.`);
      await currentUser.save();
      console.log(`[Follow API] Saved current user ${currentUser.username}.`);
    } else {
        console.log(`[Follow API] Current user ${currentUser.username} already follows ${userToFollowId}.`);
    }


    const userToFollow = await User.findById(userToFollowId);
    if (!userToFollow) {
      console.error('[Follow API] Target user not found for ID:', userToFollowId);
      // Don't return 404 here, as the current user's 'following' might have updated.
      // Handle this scenario gracefully, maybe just log it.
      // For now, let's return 404 to explicitly show the issue.
      return res.status(404).json({ message: 'User to follow not found.' });
    }
    console.log(`[Follow API] Target user fetched: ${userToFollow.username}, Followers array:`, userToFollow.followers);

    // Crucial check: Ensure 'followers' exists before pushing
    if (!userToFollow.followers) {
        console.warn(`[Follow API] 'followers' array is missing for user ${userToFollow.username}. Initializing.`);
        userToFollow.followers = [];
    }

    if (!userToFollow.followers.includes(currentUserId)) {
      userToFollow.followers.push(currentUserId);
      console.log(`[Follow API] Pushed ${currentUserId} to ${userToFollow.username}'s followers.`);
      await userToFollow.save();
      console.log(`[Follow API] Saved target user ${userToFollow.username}.`);
    } else {
        console.log(`[Follow API] Target user ${userToFollow.username} already has ${currentUserId} as follower.`);
    }

    res.json({ message: 'User followed successfully.' });

  } catch (error) {
    console.error('[Follow API] Critical Error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error during follow operation. Check server logs for details.' });
  }
};

// Unfollow a user
exports.unfollowUser = async (req, res) => {
  try {
    const userToUnfollowId = req.params.id; // The ID of the user being unfollowed
    const currentUserId = req.user.id; // The ID of the authenticated user (the unfollower)

    // 1. Update the current user's 'following' list
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ message: 'Authenticated user not found.' });
    }
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== userToUnfollowId
    );
    await currentUser.save();

    // 2. Update the target user's 'followers' list
    const userToUnfollow = await User.findById(userToUnfollowId);
    if (!userToUnfollow) {
      // This case might happen if the user was deleted, just log and continue for the follower
      console.warn(`User to unfollow (${userToUnfollowId}) not found, but proceeding with unfollow for current user.`);
    } else {
        userToUnfollow.followers = userToUnfollow.followers.filter(
            (id) => id.toString() !== currentUserId
        );
        await userToUnfollow.save();
    }

    res.json({ message: 'User unfollowed successfully.' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ message: 'Server error during unfollow operation.' });
  }
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