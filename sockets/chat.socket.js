const Message = require('../models/Message');

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
      const message = await Message.create({ sender, room: roomId, text });
      io.to(roomId).emit('receive-room', message);
    });

    socket.on('disconnect', () => {
      console.log('🔴 User disconnected:', socket.id);
    });
  });
};

module.exports = chatSocket;
