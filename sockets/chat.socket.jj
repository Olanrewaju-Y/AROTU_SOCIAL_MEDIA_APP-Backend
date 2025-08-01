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
socket.on('room-message', (message) => {
      // The message object from the client contains the full saved message.
      // The 'room' property could be a string ID or a populated object.
      // We need to ensure we get the string ID for the socket room.
      const roomId = message?.room?._id || message?.room;

      if (roomId && message) {
        // Broadcast to all other clients in the room.
        // The sender's client already added the message to its UI.
        socket.to(roomId).emit('receive-room', message);
      } else {
        console.error('Error: "room-message" received with invalid data.', { message });
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



