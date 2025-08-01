const mongoose = require('mongoose'); 

const Message = require('../models/Message');
const User = require('../models/User');





// Get private chat history
exports.createPrivateMessage = async (req, res) => {
  try {
    const { receiver, text } = req.body;
    const sender = req.user.id; // Assuming user ID is extracted from JWT in middleware

    const newMessage = await Message.create({ sender, receiver, text, type: 'private'});

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
    // 1. Get the other user's ID from the URL parameters
    // Your route is: router.get('/private/:userId', ..., getPrivateMessages);
    const { userId: otherUserId } = req.params;

    // 2. Get the current logged-in user's ID from the authentication middleware
    const currentUserId = req.user?.id; // Safely access req.user.id

    // --- Start Debugging Logs (keep these during development) ---
    console.log("\n--- getPrivateMessages - Modeled Start ---");
    console.log("Req Params (userId for other user):", req.params);
    console.log("Req User (current logged-in user):", req.user);
    console.log("Extracted otherUserId:", otherUserId);
    console.log("Extracted currentUserId:", currentUserId);
    // --- End Debugging Logs ---

    // Basic validation
    if (!otherUserId || !currentUserId) {
      console.warn('getPrivateMessages: Missing required user IDs.');
      return res.status(400).json({ message: 'Both user IDs (current user and recipient) are required to fetch private messages.' });
    }

    // Validate ObjectId format (good practice from your previous attempt)
    if (!mongoose.Types.ObjectId.isValid(otherUserId) || !mongoose.Types.ObjectId.isValid(currentUserId)) {
      console.warn('getPrivateMessages: Invalid user ID format detected.');
      return res.status(400).json({ message: 'Invalid user ID format.' });
    }

    // 3. Define the Mongoose query for private messages
    // This is the key difference from room messages:
    // We need messages where (current user sent AND other user received)
    // OR (other user sent AND current user received)
    const queryConditions = {
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ],
      type: 'private' // Ensure you only fetch messages explicitly marked as private
    };

    // --- Debugging Log ---
    console.log("MongoDB Private Message Query Conditions:", JSON.stringify(queryConditions, null, 2));
    // --- End Debugging Log ---

    const messages = await Message.find(queryConditions)
      .populate('sender', 'username avatar') // Populate sender's info (adjust fields as needed)
      .populate('receiver', 'username avatar') // Populate receiver's info (useful for client-side display consistency)
      .sort({ createdAt: 1 }); // Sort oldest to newest, just like your room messages

    // --- Debugging Logs ---
    console.log("Mongoose Find Result Count for Private Messages:", messages.length);
    if (messages.length > 0) {
        console.log("First fetched private message (after populate):", JSON.stringify(messages[0], null, 2));
    }
    console.log("--- getPrivateMessages - Modeled End ---");
    // --- End Debugging Logs ---

    // 4. Send the messages back to the client
    // No need for separate 'if (!messages || messages.length === 0)' check
    // as .json([]) handles empty array correctly.
    res.status(200).json(messages);

    // --- IMPORTANT NOTE ABOUT ROOM.MEMBERS LOGIC ---
    // The `room.members.push(req.user.id)` and `room.save()` logic in your `getRoomMessages`
    // is specific to rooms (groups) for tracking membership.
    // This logic does NOT apply to private 1-on-1 chats.
    // DO NOT include any equivalent logic here unless you have a specific
    // "private conversation document" that needs to track participants for some reason.
    // For typical private messaging, merely fetching messages between two users is sufficient.
    // --- END IMPORTANT NOTE ---

  } catch (error) {
    console.error('CRITICAL ERROR fetching private messages (modeled):', error); // More specific error log
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid ID format provided for user.', error: error.message });
    }
    res.status(500).json({ message: 'Server error fetching private messages', error: error.message });
  }
};









// Send message (non-realtime fallback)
// exports.sendMessage = async (req, res) => {
//   const { receiver, text } = req.body;
//   const message = await Message.create({
//     sender: req.user.id,
//     receiver,
//     text
//   });
//   res.status(201).json(message);
// };


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



// Get Users in convo
exports.getUsersInConversation = async (req, res) => {
  try {
    const currentUserId = req.user.id; // Assuming user ID is from JWT

    // Find all distinct users that the current user has sent messages to
    // OR received messages from.
    const sentToUsers = await Message.distinct('receiver', { sender: currentUserId });
    const receivedFromUsers = await Message.distinct('sender', { receiver: currentUserId });

    // Combine distinct user IDs and remove the current user's ID
    const conversationUserIds = [
      ...new Set([...sentToUsers, ...receivedFromUsers])
    ].filter(id => id.toString() !== currentUserId.toString());

    // Fetch the full user objects for these IDs
    const usersInConversation = await User.find({ _id: { $in: conversationUserIds } });

    res.status(200).json(usersInConversation);
  } catch (error) {
    console.error('Error fetching users in conversation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};