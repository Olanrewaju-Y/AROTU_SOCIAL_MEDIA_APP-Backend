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
        // 1. Authentication Check: Ensure user is authenticated.
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Authentication required." });
        }

        // 2. Populate Members and Parent Room:
        //    Ensure your Room schema defines 'members' and 'parentRoom' as references.
        //    For 'members', it should likely be an array of ObjectIds referencing your User model.
        //    For 'parentRoom', it should likely be an ObjectId referencing another Room model,
        //    and allow it to be null/undefined if not every room has a parent.
        const rooms = await Room.find()
            .populate({
                path: 'members',
                select: 'id' // Only populate the 'id' of members for comparison efficiency
            })
            .populate({
                path: 'parentRoom',
                // You might not need to select specific fields for parentRoom unless you display it
                // If parentRoom can be null, ensure your schema handles it.
            });

        // 3. Filter Accessible Rooms:
        const accessibleRooms = rooms.filter(room => {
            // Always allow public rooms
            if (!room.isPrivate) {
                return true;
            }

            // For private rooms, check if the current user is a member.
            // Ensure `room.members` is an array and contains valid objects after population.
            // We use optional chaining `?.` and ensure `_id` exists before calling `toString()`.
            return room.members && room.members.some(member =>
                member && member._id && member._id.toString() === req.user.id
            );
        });

        // 4. Send Filtered Rooms:
        res.status(200).json(accessibleRooms);

    } catch (error) {
        // 5. Robust Error Logging and Response:
        console.error("Error fetching rooms:", error); // Log the actual error for detailed debugging on the server
        // In a production environment, avoid sending specific error details to the client
        res.status(500).json({ message: "Server error while fetching rooms. Please try again later." });
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
