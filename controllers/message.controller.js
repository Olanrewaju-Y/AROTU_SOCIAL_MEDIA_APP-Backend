const mongoose = require('mongoose'); 

const Message = require('../models/Message');
const User = require('../models/User');




// Get private chat history
exports.getPrivateMessages = async (req, res) => {
  const otherUserId = req.params.userId;
  const currentUserId = req.user.id; // Get current user's ID from auth middleware

  try {
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ]
    })
    .sort('createdAt')
    .populate('sender', 'username avatar') // <-- Crucial for fetching sender's username and avatar
    .populate('receiver', 'username avatar'); // <-- Crucial for fetching receiver's username and avatar

    res.json(messages);
  } catch (error) {
    console.error('Error fetching private messages:', error);
    res.status(500).json({ message: 'Server error while fetching private messages' });
  }
};


// Create a private message
exports.createPrivateMessage = async (req, res) => {
  const { receiver, text } = req.body;
  const sender = req.user.id; // Sender is the authenticated user

  try {
    // 1. Create the message in the database.
    let message = await Message.create({ sender, receiver, text });

    // 2. Populate sender
    // After this, 'message' will have the 'sender' field populated
    message = await message.populate('sender', 'username avatar');

    // 3. Populate receiver (on the already-populated-with-sender message)
    // After this, 'message' will have both 'sender' and 'receiver' fields populated
    message = await message.populate('receiver', 'username avatar');

    // 4. Send the fully populated message back to the client.
    res.status(201).json(message);

  } catch (error) {
    console.error('Error creating private message:', error);
    res.status(500).json({ message: 'Server error while creating private message' });
  }
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