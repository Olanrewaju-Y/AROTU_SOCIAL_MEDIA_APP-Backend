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

    // Send message to room
socket.on('room-message', async ({ sender, roomId, text }) => {
  try {
    // Fetch full sender details (e.g., username)
   const senderUser = await User.findById(sender).select('username _id avatar'); // Add 'avatar'

    if (!senderUser) return;

    const message = {
      sender: senderUser,
      room: roomId,
      text,
      createdAt: new Date().toISOString(),
    };

    io.to(roomId).emit('receive-room', message);
  } catch (err) {
    console.error('❌ Socket room-message error:', err);
  }
});

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

