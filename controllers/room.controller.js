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

exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find().populate("members").populate("parentRoom");

    const accessibleRooms = rooms.filter(room => {
      // If the room is not private, it's always accessible.
      if (!room.isPrivate) {
        return true;
      }

      // If the room is private, check if the user is a member.
      // We need to map the member objects to their IDs for the comparison.
      const memberIds = room.members.map(member => member._id.toString()); // Convert IDs to string for consistent comparison

      return memberIds.includes(req.user.id.toString()); // Ensure req.user.id is also a string
    });

    res.status(200).json(accessibleRooms);
  } catch (error) {
    res.status(500).json({ message: "Error fetching rooms", error: error.message });
  }
};

// Get public rooms
exports.getPublicRooms = async (req, res) => {
  try {
    const publicRooms = await Room.find({ isPrivate: false })
      .populate("members")
      .populate("parentRoom");

    res.status(200).json(publicRooms);
  } catch (error) {
    res.status(500).json({ message: "Error fetching public rooms", error: error.message });
  }
};

// Get Private rooms
exports.getPrivateRooms = async (req, res) => {
  try {
    // Find only private rooms
    const privateRooms = await Room.find({ isPrivate: true })
      .populate("members")
      .populate("parentRoom");

    // Filter private rooms to only include those the user is a member of
    // Assuming req.user.id holds the ID of the currently authenticated user
    const accessiblePrivateRooms = privateRooms.filter(room => 
      room.members.some(member => member._id.equals(req.user.id))
    );

    res.status(200).json(accessiblePrivateRooms);
  } catch (error) {
    res.status(500).json({ message: "Error fetching private rooms", error: error.message });
  }
};


// Add user to room
exports.addUserToRoom = async (req, res) => {
    try {
        const { roomId, userId } = req.body;
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        // Check if the user is the creator or an admin
        if (room.creator.toString() !== req.user.id && !room.admins.includes(req.user.id)) {
            return res.status(403).json({ message: "You do not have permission to add users to this room" });
        }
        // Check if the user is already a member
        if (room.members.includes(userId)) {
            return res.status(400).json({ message: "User is already a member of this room" });
        }

        // Add the user to the room's members
        room.members.push(userId);
        await room.save();

        res.status(200).json({ message: "User added to room successfully", room });
    } catch (error) {
        res.status(500).json({ message: "Error adding user to room", error });
    }
};

// Remove user from a room
exports.removeUserFromRoom = async (req, res) => {
    try {
        const { roomId, userId } = req.body;
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        // Check if the user is the creator or an admin
        if (room.creator.toString() !== req.user.id && !room.admins.includes(req.user.id)) {
            return res.status(403).json({ message: "You do not have permission to remove users from this room" });
        }
        // Check if the user is a member
        if (!room.members.includes(userId)) {
            return res.status(400).json({ message: "User is not a member of this room" });
        }

        // Remove the user from the room's members
        room.members = room.members.filter(member => member !== userId);
        await room.save();

        res.status(200).json({ message: "User removed from room successfully", room });
    } catch (error) {
        res.status(500).json({ message: "Error removing user from room", error });
    }
};



// Get a single room by ID
exports.getRoomById = async (req, res) => {
    try {
        const roomId = req.params.id;

        // Populate members, admins, and creator to perform comprehensive access checks.
        // It's crucial to populate these fields so their _id can be accessed.
        const room = await Room.findById(roomId)
                                .populate("members", "_id username roomNickname avatar") // Populate relevant user fields
                                .populate("admins", "_id") // Admins are likely just IDs, so just populate _id
                                .populate("creator", "_id"); // Creator is also an ID, just populate _id

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        // Access Control Logic for Private Rooms
        if (room.isPrivate) {
            // Ensure req.user.id is a string for consistent comparison
            const currentUserId = req.user.id.toString();

            // Check if the current user is a member of the room
            const isMember = room.members.some(member => member._id.toString() === currentUserId);

            // Check if the current user is an admin of the room
            // Ensure 'admins' array exists before attempting to iterate
            const isAdmin = room.admins?.some(adminId => adminId.toString() === currentUserId);

            // Check if the current user is the creator of the room
            // Ensure 'creator' object exists before attempting to access _id
            const isCreator = room.creator && room.creator._id.toString() === currentUserId;

            // If the room is private and the user is neither a member, nor an admin, nor the creator, deny access
            if (!isMember && !isAdmin && !isCreator) {
                return res.status(403).json({ message: "You do not have permission to access this private room." });
            }
        }

        // If it's a public room OR if it's a private room and the user has access, send the room data
        res.status(200).json(room);

    } catch (error) {
        // Handle Mongoose CastError for invalid IDs gracefully
        if (error.name === 'CastError') {
            return res.status(400).json({ message: "Invalid room ID format." });
        }
        console.error("Error fetching room details:", error);
        res.status(500).json({ message: "Error fetching room details", error: error.message });
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

    // user join room room.members +1
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    if (!room.members.includes(req.user.id)) {
      room.members.push(req.user.id);
      await room.save();
    }  

  } catch (error) {
    console.error('Error fetching room messages:', error);
    res.status(500).json({ message: 'Error fetching messages', error });
  }
};
