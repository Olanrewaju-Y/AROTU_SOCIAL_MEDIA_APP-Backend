const Room = require("../models/Room");
const User = require("../models/User");
const Message = require('../models/Message'); // import the Message model
const bcrypt = require("bcrypt");


// Create a new room
exports.createRoom = async (req, res) => {
  try {
    const { name, description, avatar, isPrivate = false, members = [], parentRoom, type } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Room name is required" });
    }

    const newRoom = new Room({
      name,
      description: req.body.description || '',
      avatar: req.body.avatar || '',
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
      // It's good practice to ensure the user object from your auth middleware is present.
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Authentication required." });
        }

        const rooms = await Room.find().populate("members").populate("parentRoom");

        // Filter out private rooms the user is not a member of
        const accessibleRooms = rooms.filter(room => {
            if (!room.isPrivate) return true; // Public rooms are always accessible
            // For private rooms, check if the user is a member.
            // `room.members` is an array of User objects, so we must check the `_id` of each member.
            return room.members.some(member => member._id.toString() === req.user.id);
        });

        res.status(200).json(accessibleRooms);
    } catch (error) {
    console.error("Error fetching rooms:", error); // Log the actual error for debugging
        res.status(500).json({ message: "Server error while fetching rooms" }); // Send a generic error to the client
   }
};

// Get public Rooms
exports.getPublicRooms = async (req, res) => {
  try {
    // Optional: Still verify authentication if your app requires it
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required." });
    }

    // Fetch only public rooms
    const publicRooms = await Room.find({ isPrivate: false })
      .populate("members")
      .populate("parentRoom");

    res.status(200).json(publicRooms);
  } catch (error) {
    console.error("Error fetching public rooms:", error);
    res.status(500).json({ message: "Server error while fetching public rooms" });
  }
};


// Get Private rooms
exports.getPrivateRooms = async (req, res) => {
  try {
    // Require authentication
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required." });
    }

    // Fetch private rooms only
    const privateRooms = await Room.find({ isPrivate: true })
      .populate("members")
      .populate("parentRoom");

    // Filter private rooms to only include those where the user is a member
    const userRooms = privateRooms.filter(room =>
      room.members.some(member => member._id.toString() === req.user.id)
    );

    res.status(200).json(userRooms);
  } catch (error) {
    console.error("Error fetching private rooms:", error);
    res.status(500).json({ message: "Server error while fetching private rooms" });
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
    const { name, description, avatar, isPrivate, type, parentRoom } = req.body;
    const roomId = req.params.id;

    // Find the room by its ID
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    // check if req.user.id is the room.creator or an admin.
    if (room.creator.toString() !== req.user.id && !room.admins.includes(req.user.id)) {
      return res.status(403).json({ message: 'You do not have permission to update this room.' });
    }
        
    // Update the fields that were provided in the request body
    room.name = name ?? room.name;
    room.description = description ?? room.description;
    room.avatar = avatar ?? room.avatar;
    room.isPrivate = isPrivate ?? room.isPrivate;
    room.type = type ?? room.type;

    // Handle parentRoom logic
    if (type === 'sub' && parentRoom) {
      const parent = await Room.findById(parentRoom);
      if (!parent || parent.type !== 'main') {
        return res.status(400).json({ message: 'Invalid parent room specified.' });
      }
      room.parentRoom = parentRoom;
    } else {
      room.parentRoom = undefined;
    }
    const updatedRoom = await room.save();
    res.status(200).json(updatedRoom);
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ message: 'Server error while updating room.' });
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

    const populated = await savedMessage.populate('sender', 'roomNickname username avatar');

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
      .populate('sender', 'roomNickname username avatar') // populate sender's roomNickname
      .sort({ createdAt: 1 }); // optional: sort oldest to newest

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching room messages:', error);
    res.status(500).json({ message: 'Error fetching messages', error });
  }
};
