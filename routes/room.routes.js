const express = require("express");
const router = express.Router();
const roomController = require("../controllers/room.controller");
const {auth} = require('../middleware/authMiddleware');


router.post("/rooms", auth, roomController.createRoom);
router.get("/rooms", roomController.getAllRooms);
router.get("/rooms/:id", roomController.getRoomById);
router.put("/rooms/:id", auth, roomController.updateRoom);
router.delete("/rooms/:id", auth, roomController.deleteRoom);
router.post("/rooms/admins/add", auth, roomController.addAdminToRoom);
router.post("/rooms/admins/remove", auth, roomController.removeAdminFromRoom);

module.exports = router;