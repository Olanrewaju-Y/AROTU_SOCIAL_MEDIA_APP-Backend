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

