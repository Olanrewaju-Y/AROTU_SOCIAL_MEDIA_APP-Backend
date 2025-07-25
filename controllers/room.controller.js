const Room = require("../models/Room");
const User = require("../models/User");
const Message = require('../models/Message'); // import the Message model
const bcrypt = require("bcrypt");


// Create a new room
exports.createRoom = async (req, res) => {
  try {
    const { name, description, avatar, isPublic, password, isPrivate = false, members = [], parentRoom, type } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Room name is required" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newRoom = new Room({
      name,
      description: req.body.description || '',
      avatar: req.body.avatar || '',
      isPublic,
      password: isPrivate ? hashedPassword : null, // only set password if room is private
      isPrivate,
      members: members.length > 0 ? members : [req.user.id], // fallback to creator as member
      parentRoom: parentRoom || null,
      type: type || 'public',
      creator: req.user.id
    });

    const savedRoom = await newRoom.save();
    res.status(201).json(savedRoom);
  } catch (error) {
    console.error("Room creation failed:", error); // log for debugging
    res.status(500).json({ message: "Error creating room", error: error.message });
  }
};

// Get all rooms
exports.getAllRooms = async (req, res) => {
    try {
        const rooms = await Room.find().populate("members").populate("parentRoom");

        // Filter out private rooms the user is not a member of
        const accessibleRooms = rooms.filter(room => !room.isPrivate || room.members.includes(req.user.id));

        res.status(200).json(accessibleRooms);
    } catch (error) {
        res.status(500).json({ message: "Error fetching rooms", error });
    }
};

// Get a single room by ID
exports.getRoomById = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id).populate("members").populate("parentRoom");
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        // Restrict access to private rooms
        if (room.isPrivate && !room.members.includes(req.user.id)) {
            return res.status(403).json({ message: "Access denied to private room" });
        }

        res.status(200).json(room);
    } catch (error) {
        res.status(500).json({ message: "Error fetching room", error });
    }
};

// Update a room
exports.updateRoom = async (req, res) => {
  try {
    const { name, description, avatar, isPrivate, members, parentRoom, type } = req.body;

    // Optional: protect immutable fields
    const blockedFields = ['creator', '_id', 'createdAt', 'updatedAt'];
    for (const key of Object.keys(req.body)) {
      if (blockedFields.includes(key)) {
        return res.status(400).json({ message: `Field "${key}" cannot be updated.` });
      }
    }

    // Optional: validate `type` if used
    const allowedTypes = ['public', 'private'];
    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({ message: `Invalid room type: ${type}` });
    }

    const updatedFields = {};
    if (name !== undefined) updatedFields.name = name;
    if (isPrivate !== undefined) updatedFields.isPrivate = isPrivate;
    if (description !== undefined) updatedFields.description = description;
    if (avatar !== undefined) updatedFields.avatar = avatar;
    if (isPrivate && req.body.password) {
      const hashedPassword = await bcrypt.hash(req.body.password, 12);
      updatedFields.password = hashedPassword;
    }
    if (members !== undefined) updatedFields.members = members;
    if (parentRoom !== undefined) updatedFields.parentRoom = parentRoom;
    if (type !== undefined) updatedFields.type = type;

    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      updatedFields,
      { new: true, runValidators: true }
    )
      .populate("members")
      .populate("parentRoom");

    if (!updatedRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json(updatedRoom);
  } catch (error) {
    console.error("Error updating room:", error);
    res.status(500).json({ message: "Error updating room", error: error.message });
  }
};


// Delete a room
exports.deleteRoom = async (req, res) => {
    try {
        const deletedRoom = await Room.findByIdAndDelete(req.params.id);

        if (!deletedRoom) {
            return res.status(404).json({ message: "Room not found" });
        }
        res.status(200).json({ message: "Room deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting room", error });
    }
};

// Add an admin to a room
exports.addAdminToRoom = async (req, res) => {
    try {
        const { roomId, userId } = req.body;

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        if (!room.admins.includes(userId)) {
            room.admins.push(userId);
            await room.save();
        }

        res.status(200).json({ message: "Admin added successfully", room });
    } catch (error) {
        res.status(500).json({ message: "Error adding admin", error });
    }
};

// Remove an admin from a room
exports.removeAdminFromRoom = async (req, res) => {
    try {
        const { roomId, userId } = req.body;

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        room.admins = room.admins.filter(adminId => adminId.toString() !== userId);
        await room.save();

        res.status(200).json({ message: "Admin removed successfully", room });
    } catch (error) {
        res.status(500).json({ message: "Error removing admin", error });
    }
};

// Post room messages
exports.postRoomMessages = async (req, res) => {
  const { text, userId } = req.body;
  const roomId = req.params.id;

  try {
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const newMessage = new Message({ sender: userId, room: roomId, text });
    const savedMessage = await newMessage.save();

    const populated = await savedMessage.populate('sender', 'roomNickname');

    const io = req.app.get('io');
    if (io) io.to(roomId).emit('receiveMessage', populated);

    res.status(201).json(populated);
  } catch (err) {
    console.error('Message Error:', err.message);
    res.status(500).json({ error: 'Message could not be saved.', details: err.message });
  }
};

// Get room messages
exports.getRoomMessages = async (req, res) => {
  try {
    const roomId = req.params.id;

    const messages = await Message.find({ room: roomId })
      .populate('sender', 'roomNickname') // populate sender's username
      .sort({ createdAt: 1 }); // optional: sort oldest to newest

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching room messages:', error);
    res.status(500).json({ message: 'Error fetching messages', error });
  }
};
