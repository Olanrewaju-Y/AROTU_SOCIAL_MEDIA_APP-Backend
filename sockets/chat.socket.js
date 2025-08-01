const Message = require('../models/Message'); // Assuming this handles message saving
const User = require('../models/User'); // Assuming this is for user-related tasks, though not directly used in socket for this scenario

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
      console.log(`Frontend: User ${userId} added with socket ID ${socket.id}`);
      // You can optionally emit this info to all clients or specific ones
      // io.emit('getUsers', connectedUsers); // For displaying online users
    });

    // Join private chat - The client joins a room named after its own userId.
    // This allows the backend to easily target messages to this specific user.
    socket.on('join-private', ({ userId }) => {
      // Each user should join a room named after their own userId.
      // This is crucial for sending targeted private messages to them.
      socket.join(userId);
      console.log(`Socket ${socket.id} joined private room for user: ${userId}`);
    });

    // Join room (group) - Keep as is, works perfectly
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined group room: ${roomId}`);
    });

    // Send private message
    socket.on('private-message', async ({ senderId, receiverId, text }) => {
      try {
        // Find the actual sender and receiver user objects (optional, if you want full user data in message)
        // You might already have this from the token in your REST API for message creation.
        // For simplicity, we'll assume the REST API handles populating sender/receiver
        // and just use the IDs for socket emission here.

        // Create the message in the database via your Message model
        // const message = await Message.create({
        //   sender: senderId,    // Storing sender ID
        //   receiver: receiverId,  // Storing receiver ID
        //   text: text,
        //   // You might need to add a type: 'private' field to distinguish from room messages
        // });

        // Populate sender and receiver for the message object that will be sent via socket
        // This is crucial for the frontend to display sender/receiver info correctly.
        // Assuming your Message model has a static method or virtuals to populate
        // Or you can fetch and populate manually here if `Message.create` doesn't return populated objects
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username avatar') // Populate only necessary fields
          .populate('receiver', 'username avatar'); // Populate receiver as well if needed on frontend

        if (!populatedMessage) {
            console.error("Failed to find or populate message after creation.");
            return;
        }

        // Emit to the receiver's private room.
        // The receiver's socket should have joined a room named after their userId.
        io.to(receiverId).emit('receive-private-message', populatedMessage);
        console.log(`Backend: Emitted private message from ${senderId} to ${receiverId}`);

        // Also emit back to the sender if they have another device or tab open,
        // or for immediate confirmation/sync if not handled optimistically on sender's side.
        // However, your frontend already handles optimistic updates and then updates,
        // so this might cause a duplicate if not carefully handled on the frontend.
        // The current frontend design implies the sender's client will add it immediately,
        // and the `receive-private-message` for the *sender* should either be ignored
        // or used for confirmation/replacement of an optimistic message.
        // For now, only sending to receiver to avoid complex duplicate logic on sender side.
        // If you want sender to receive confirmation via socket, you'd emit to senderId as well:
        // io.to(senderId).emit('receive-private-message', populatedMessage);

      } catch (error) {
        console.error('Error sending private message:', error);
      }
    });

    // Send message to room - Keep as is, working perfectly
    socket.on('room-message', (message) => {
      const roomId = message?.room?._id || message?.room;
      if (roomId && message) {
        socket.to(roomId).emit('receive-room', message);
        console.log(`Backend: Emitted room message to ${roomId}`);
      } else {
        console.error('Error: "room-message" received with invalid data.', { message });
      }
    });

    // Leave room - Keep as is
    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left room ${roomId}`);
    });

    socket.on('disconnect', () => {
      console.log('🔴 User disconnected:', socket.id);
      // Remove user from connectedUsers map on disconnect
      for (const userId in connectedUsers) {
        if (connectedUsers[userId] === socket.id) {
          delete connectedUsers[userId];
          console.log(`User ${userId} removed from connected users.`);
          break;
        }
      }
    });
  });
};

module.exports = chatSocket;