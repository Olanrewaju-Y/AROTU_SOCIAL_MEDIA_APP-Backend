const mongoose = require('mongoose'); 

const Message = require('../models/Message');
const User = require('../models/User');





// Get private chat history
exports.createPrivateMessage = async (req, res) => {
  try {
    const { receiver, text } = req.body;
    const sender = req.user.id; // Assuming user ID is extracted from JWT in middleware

    const newMessage = await Message.create({ sender, receiver, text });

    // Populate sender and receiver for the response
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error creating private message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Get private messages
exports.getPrivateMessages = async (req, res) => {
  try {
    const { userId: otherUserId } = req.params;
    const currentUserId = req.user?.id;

    // Basic presence check
    if (!otherUserId || !currentUserId) {
      return res.status(400).json({ message: 'Both user IDs are required to fetch private messages.' });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(otherUserId) || !mongoose.Types.ObjectId.isValid(currentUserId)) {
      return res.status(400).json({ message: 'Invalid user ID format.' });
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId, type: 'private' },
        { sender: otherUserId, receiver: currentUserId, type: 'private' }
      ]
    })
    .sort('createdAt')
    .populate({
      path: 'sender',
      select: 'username avatar',
      strictPopulate: false, // Prevents error if sender no longer exists
    })
    .populate({
      path: 'receiver',
      select: 'username avatar',
      strictPopulate: false,
    });

    // Optional: handle no messages case
    if (!messages || messages.length === 0) {
      return res.status(200).json([]); // Return empty array, not an error
    }

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching private messages:', error);

    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid ID provided.', error: error.message });
    }

    res.status(500).json({ message: 'Server error', error: error.message });
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