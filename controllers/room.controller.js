const Room = require("../models/Room");
const User = require("../models/User");

// Create a new room
exports.createRoom = async (req, res) => {
    try {
        const { name, isPrivate, members, parentRoom, type } = req.body;

        const newRoom = new Room({
            name,
            isPrivate,
            members,
            parentRoom,
            type
        });

        const savedRoom = await newRoom.save();
        res.status(201).json(savedRoom);
    } catch (error) {
        res.status(500).json({ message: "Error creating room", error });
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
        const updatedRoom = await Room.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).populate("members").populate("parentRoom");

        if (!updatedRoom) {
            return res.status(404).json({ message: "Room not found" });
        }
        res.status(200).json(updatedRoom);
    } catch (error) {
        res.status(500).json({ message: "Error updating room", error });
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