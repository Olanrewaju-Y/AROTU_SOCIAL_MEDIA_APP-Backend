const Message = require('../models/Message');
const Room = require('../models/Room');

// Get private chat history
exports.getPrivateMessages = async (req, res) => {
  const otherUserId = req.params.userId;
  const messages = await Message.find({
    $or: [
      { sender: req.user.id, receiver: otherUserId },
      { sender: otherUserId, receiver: req.user.id }
    ]
  }).sort('createdAt');
  res.json(messages);
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

// Get group room messages
exports.getRoomMessages = async (req, res) => {
  const roomId = req.params.roomId;
  const messages = await Message.find({ room: roomId }).sort('createdAt');
  res.json(messages);
};

// Create group room
exports.createRoom = async (req, res) => {
  const { name, members } = req.body;
  const room = await Room.create({
    name,
    members: [...members, req.user.id]
  });
  res.status(201).json(room);
};

// Get my rooms
exports.getMyRooms = async (req, res) => {
  const rooms = await Room.find({ members: req.user.id });
  res.json(rooms);
};
