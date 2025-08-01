const Message = require('../models/Message');
const User = require('../models/User'); // Import User model for population

// In-memory mapping of userId to socketId
const onlineUsers = new Map(); // Stores: userId -> socketId

const chatSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('🟢 User connected:', socket.id);

    // --- Core User Presence Management ---
    // When a user logs in and establishes socket connection (from frontend after auth)
    socket.on('addUser', (userId) => {
      // If the user is already connected with a different socket (e.g., new tab),
      // we can update their socketId. Or, if you want to support multiple tabs,
      // you could store an array of socketIds for each userId.
      // For simplicity, let's assume one active socket per user here.
      onlineUsers.set(userId, socket.id);
      socket.userId = userId; // Attach userId to the socket for easy lookup on disconnect
      console.log(`User ${userId} associated with socket ${socket.id}`);
      // Optionally emit to all clients who is online (e.g., for status indicators)
      io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
    });

    // --- Private Chat Logic ---
    // User joins their own private room (named after their userId)
    // This room is used for direct private messages to that user.
    socket.on('join-private', ({ userId }) => {
      // Only join if it's the user's own ID
      if (socket.userId && socket.userId === userId) {
         socket.join(userId); // Each user joins a room named after their own ID
         console.log(`Socket ${socket.id} (User ${userId}) joined private room ${userId}`);
      } else {
         console.warn(`Socket ${socket.id} tried to join private room ${userId} but current user is ${socket.userId}`);
      }
    });

    // Send private message
    socket.on('private-message', async (data) => {
      try {
        const { senderId, receiverId, text } = data; // Expect senderId, receiverId, text from client

        // Save message to DB
        let message = await Message.create({ sender: senderId, receiver: receiverId, text });

        // IMPORTANT: Populate sender and receiver details for real-time broadcast
        message = await message.populate('sender', 'username avatar').populate('receiver', 'username avatar').execPopulate();

        // Emit to the receiver's private room (their userId is the room name)
        // Check if receiver is online (has a socket mapped in onlineUsers)
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
             io.to(receiverId).emit('receive-private-message', message); // Emit to room named after receiverId
             console.log(`Emitting private message from ${senderId} to receiver ${receiverId} (room ${receiverId})`);
        } else {
             console.log(`Receiver ${receiverId} is not currently online. Message saved to DB.`);
             // You might want to add logic here for push notifications, unread counts, etc.
        }

        // Also emit back to the sender's private room for immediate confirmation/update on their UI
        // This is important if optimistic update fails or for consistency across sender's multiple devices.
        // We ensure we don't emit to sender twice if sender and receiver are the same person (self-chat)
        if (String(senderId) !== String(receiverId)) { // If sender is not chatting to themselves
            const senderSocketId = onlineUsers.get(senderId);
            if (senderSocketId) {
                io.to(senderId).emit('receive-private-message', message); // Emit to room named after senderId
                console.log(`Emitting private message confirmation to sender ${senderId} (room ${senderId}).`);
            }
        }

      } catch (error) {
        console.error('Error sending private message via socket:', error);
      }
    });

    // --- Group Chat Logic (already working, just ensuring population) ---
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Send message to room (group message)
    socket.on('room-message', async (data) => {
        try {
            const { senderId, roomId, text } = data;

            // Save message to DB
            let message = await Message.create({ sender: senderId, room: roomId, text });

            // Populate sender details for real-time broadcast
            message = await message.populate('sender', 'username avatar').execPopulate();

            // Emit to all clients in the room (including sender, the frontend can handle it)
            // Or, to exclude sender: socket.to(roomId).emit('receive-room-message', message);
            io.to(roomId).emit('receive-room-message', message);
            console.log(`Emitting room message from ${senderId} to room ${roomId}`);

        } catch (error) {
            console.error('Error sending room message via socket:', error);
        }
    });

    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left room ${roomId}`);
    });

    // --- Disconnect Logic ---
    socket.on('disconnect', () => {
      console.log('🔴 User disconnected:', socket.id);
      // Remove user from the onlineUsers map
      if (socket.userId) { // Check if userId was associated
        onlineUsers.delete(socket.userId);
        console.log(`User ${socket.userId} removed from online users.`);
      }
      io.emit('getOnlineUsers', Array.from(onlineUsers.keys())); // Broadcast updated online users list
    });
  });
};

module.exports = chatSocket;