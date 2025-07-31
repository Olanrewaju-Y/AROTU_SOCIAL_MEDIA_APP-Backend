const mongoose = require('mongoose');

const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');


// Get private chat history
exports.getPrivateMessages = async (req, res) => {
  const otherUserId = req.params.userId;
  const messages = await Message.find({
    $or: [
      { sender: req.user.id, receiver: otherUserId },
      { sender: otherUserId, receiver: req.user.id }
    ]
  }).sort('createdAt');
  res.json(messages);
};

// Send message (non-realtime fallback)
exports.sendMessage = async (req, res) => {
  const { receiver, text } = req.body;
  const message = await Message.create({
    sender: req.user.id,
    receiver,
    text
  });
  res.status(201).json(message);
};


// Example Backend Endpoint: /api/messages/recent-conversations
// This is a simplified example. A real implementation might involve complex aggregation
// to find the most recent message for each unique conversation partner.

exports.recentConversations = async (req, res) => {
  try {
    const userId = req.user.id; // Authenticated user ID

    // Find all messages sent by or received by the user
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    })
    .sort({ createdAt: -1 }) // Sort by most recent message first
    .populate('sender', 'username avatar createdAt') // Populate sender info
    .populate('receiver', 'username avatar createdAt') // Populate receiver info
    .lean(); // Return plain JavaScript objects

    const conversationMap = new Map(); // Map to store the most recent interaction with each user

    messages.forEach(msg => {
      const participantId = String(msg.sender._id) === String(userId) ? msg.receiver._id : msg.sender._id;
      const participantUser = String(msg.sender._id) === String(userId) ? msg.receiver : msg.sender;

      // If this participant is not already in the map, or this message is more recent
      if (!conversationMap.has(participantId) || new Date(msg.createdAt) > new Date(conversationMap.get(participantId).lastMessageTime)) {
        conversationMap.set(participantId, {
          ...participantUser, // Store participant's user data
          lastMessageTime: msg.createdAt // Store the latest message time
        });
      }
    });

    // Convert map values to an array and sort by last message time (most recent first)
    const recentUsers = Array.from(conversationMap.values())
                            .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

    res.json(recentUsers);

  } catch (error) {
    console.error('Error fetching recent conversations:', error);
    res.status(500).json({ message: 'Server error while fetching recent conversations' });
  }
};