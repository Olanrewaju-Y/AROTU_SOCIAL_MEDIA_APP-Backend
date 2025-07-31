const Message = require('../models/Message');
const User = require('../models/User'); // Import User model for population

// In-memory mapping of userId to socketId
const onlineUsers = new Map(); // Stores: userId -> socketId

const chatSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('🟢 User connected:', socket.id);

    // When a user logs in and joins (from frontend after auth)
    socket.on('addUser', (userId) => {
      onlineUsers.set(userId, socket.id);
      console.log(`User ${userId} associated with socket ${socket.id}`);
      // Optionally emit to all clients who is online (e.g., for status indicators)
      io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
    });

    // Join private chat room (using user's own ID as a room)
    // This is useful if a user has multiple tabs/devices, all joining their own ID room
    socket.on('join-private', ({ userId }) => {
      socket.join(userId); // Each user joins a room named after their own ID
      console.log(`Socket ${socket.id} joined private room ${userId}`);
    });

    // Join room (group)
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Send private message
    socket.on('private-message', async (data) => {
      try {
        const { senderId, receiverId, text } = data; // Expect senderId, receiverId, text from client

        // Save message to DB
        let message = await Message.create({ sender: senderId, receiver: receiverId, text });

        // IMPORTANT: Populate sender and receiver details for real-time broadcast
        // This ensures the emitted 'message' object has 'sender.username', 'sender.avatar', etc.
        message = await message.populate('sender', 'username avatar').populate('receiver', 'username avatar').execPopulate(); // .execPopulate() for new doc

        // Emit to the receiver's private room
        // If receiver is online and has joined their userId room
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
             io.to(receiverId).emit('receive-private-message', message); // Emit to room named after receiverId
             console.log(`Emitting to receiver ${receiverId} at socket ${receiverSocketId}`);
        } else {
             console.log(`Receiver ${receiverId} is not currently online (no socket ID found).`);
        }


        // Also emit back to the sender's private room for immediate confirmation/update on their UI
        // This is important if optimistic update fails or for consistency across sender's multiple devices.
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId && senderSocketId !== receiverSocketId) { // Avoid double-emitting if sender is receiver
            io.to(senderId).emit('receive-private-message', message); // Emit to room named after senderId
            console.log(`Emitting to sender ${senderId} at socket ${senderSocketId} for confirmation.`);
        }


      } catch (error) {
        console.error('Error sending private message via socket:', error);
      }
    });

    // Send message to room (group message)
    socket.on('room-message', async (data) => {
        try {
            const { senderId, roomId, text } = data;

            // Save message to DB
            let message = await Message.create({ sender: senderId, room: roomId, text });

            // Populate sender details for real-time broadcast
            message = await message.populate('sender', 'username avatar').execPopulate();

            // Emit to all clients in the room (except sender, as they optimistically updated)
            io.to(roomId).emit('receive-room-message', message); // Emit to the specific group room
            console.log(`Emitting room message to room ${roomId}`);

        } catch (error) {
            console.error('Error sending room message via socket:', error);
        }
    });

    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left room ${roomId}`);
    });

    socket.on('disconnect', () => {
      console.log('🔴 User disconnected:', socket.id);
      // Remove user from the onlineUsers map
      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      // Optionally broadcast updated online users list
      io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
    });
  });
};

module.exports = chatSocket;