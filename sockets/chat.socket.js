const Message = require('../models/Message'); // Keep for potential population, but not for creation here
const User = require('../models/User'); // Keep for potential population, but not for creation here

const chatSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('🟢 User connected:', socket.id);

    // Store a mapping of userId to socketId for private messaging
    // In a production environment, use a more robust store (Redis, database)
    // for scalability across multiple server instances. For a single instance,
    // a simple in-memory map is okay for demonstration.
    const connectedUsers = {};

    socket.on('addUser', (userId) => {
      connectedUsers[userId] = socket.id;
      console.log(`Backend Socket: User ${userId} added with socket ID ${socket.id}`);
      // You can optionally emit this info to all clients or specific ones
      // io.emit('getUsers', connectedUsers); // For displaying online users
    });

    // Join private chat - The client joins a room named after its own userId.
    // This allows the backend to easily target messages to this specific user.
    socket.on('join-private', ({ userId }) => {
      // Each user should join a room named after their own userId.
      // This is crucial for sending targeted private messages to them.
      socket.join(userId);
      console.log(`Backend Socket: Socket ${socket.id} joined private room for user: ${userId}`);
    });

    // Join room (group) - Keep as is, works perfectly
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`Backend Socket: Socket ${socket.id} joined group room: ${roomId}`);
    });

    // Send private message (from frontend)
    // This event should receive the message *already saved by the REST API*.
    // The frontend should send the full populated message object here.
    socket.on('private-message', async (populatedMessage) => { // Changed parameter name for clarity
      try {
        // --- IMPORTANT CHANGE HERE ---
        // DO NOT call Message.create() here. The message is already saved by the REST API.
        // This handler's job is just to broadcast the already saved message.

        // Ensure the populatedMessage has the necessary IDs for routing
        if (!populatedMessage || !populatedMessage.sender || !populatedMessage.receiver || !populatedMessage.text) {
          console.error("Backend Socket: 'private-message' received with malformed data:", populatedMessage);
          return;
        }

        const senderId = populatedMessage.sender._id;
        const receiverId = populatedMessage.receiver._id;

        // Emit to the receiver's private room.
        // The receiver's socket should have joined a room named after their userId.
        io.to(receiverId).emit('receive-private-message', populatedMessage);
        console.log(`Backend Socket: Emitted private message from ${senderId} to ${receiverId} (via socket broadcast).`);

        // OPTIONAL: If you want the sender's other tabs/devices to receive the message via socket,
        // you would also emit to the sender's room.
        // io.to(senderId).emit('receive-private-message', populatedMessage);


      } catch (error) {
        console.error('Backend Socket: Error processing private message broadcast:', error);
      }
    });

    // Send message to room - Keep as is, working perfectly
    socket.on('room-message', (message) => {
      const roomId = message?.room?._id || message?.room;
      if (roomId && message) {
        socket.to(roomId).emit('receive-room', message);
        console.log(`Backend Socket: Emitted room message to ${roomId}`);
      } else {
        console.error('Backend Socket: "room-message" received with invalid data.', { message });
      }
    });

    // Leave room - Keep as is
    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
      console.log(`Backend Socket: Socket ${socket.id} left room ${roomId}`);
    });

    socket.on('disconnect', () => {
      console.log('🔴 Backend Socket: User disconnected:', socket.id);
      // Remove user from connectedUsers map on disconnect
      for (const userId in connectedUsers) {
        if (connectedUsers[userId] === socket.id) {
          delete connectedUsers[userId];
          console.log(`Backend Socket: User ${userId} removed from connected users.`);
          break;
        }
      }
    });
  });
};

module.exports = chatSocket;