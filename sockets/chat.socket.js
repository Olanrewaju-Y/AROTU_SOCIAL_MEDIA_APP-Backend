const Message = require('../models/Message');
const User = require('../models/User');

const chatSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('🟢 User connected:', socket.id);

    // Join private chat
    socket.on('join-private', ({ userId }) => {
      socket.join(userId); // room = userId
    });

    // Join room (group)
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
    });

    // Send private message
    socket.on('private-message', async ({ sender, receiver, text }) => {
      const message = await Message.create({ sender, receiver, text });
      io.to(receiver).emit('receive-private', message);
    });

// Post a new message to a room
exports.postRoomMessages = async (req, res) => {
  try {
    // For better security, userId should ideally be derived from the auth token (e.g., req.user.id)
    const { text, userId } = req.body;
    const { id: roomId } = req.params;

    if (!text || !userId || !roomId) {
      return res.status(400).json({ message: 'Missing required fields: text, userId, or roomId' });
    }

    // Create and save the new message instance
    const newMessage = new Message({
      text,
      sender: userId,
      room: roomId,
    });
    await newMessage.save();

    // Crucially, find the message we just saved and populate the sender field.
    // This ensures the response contains the complete user object.
    const savedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'username avatar roomNickname');

    // The 'savedMessage' object now contains the full sender details.
    // The frontend will receive this and emit it via socket, ensuring all clients get the same complete data.
    res.status(201).json(savedMessage);

  } catch (error) {
    console.error('Error posting message:', error);
    res.status(500).json({ message: 'Error posting message', error });
  }
};

// Get room messages
exports.getRoomMessages = async (req, res) => {
  try {
    const { id: roomId } = req.params;

    // Optional: check if room exists
    const roomExists = await Room.findById(roomId);
    if (!roomExists) {
      return res.status(404).json({ message: "Room not found" });
    }

    const messages = await Message.find({ room: roomId })
      .populate('sender', 'username avatar roomNickname') // Fetch user details
      .sort({ createdAt: 1 }); // Sort from oldest to newest

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching room messages:", error);
    res.status(500).json({ message: "Failed to get messages", error: error.message });
  }
};



 // In your backend socket.io connection file
    socket.on('leave-room', (roomId) => {
        socket.leave(roomId);
        console.log(`Socket ${socket.id} left room ${roomId}`);
    });

    socket.on('disconnect', () => {
      console.log('🔴 User disconnected:', socket.id);
    });
  });
};

module.exports = chatSocket;


   
