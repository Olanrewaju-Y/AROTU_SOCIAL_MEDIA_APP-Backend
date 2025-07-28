const express = require("express");
const router = express.Router();
const roomController = require("../controllers/room.controller");
const {auth} = require('../middleware/authMiddleware');


router.post("/", auth, roomController.createRoom);
router.get("/", auth, roomController.getAllRooms);
router.get("/public", auth, roomController.getPublicRooms);
router.get("/private", auth, roomController.getPrivateRooms);
router.post("/addUser", auth, roomController.addUserToRoom);
router.post("/removeUser", auth, roomController.removeUserFromRoom);
router.post("/admins/add", auth, roomController.addAdminToRoom);
router.post("/admins/remove", auth, roomController.removeAdminFromRoom);
router.get("/:id", auth, roomController.getRoomById);
router.put("/:id", auth, roomController.updateRoom);
router.delete("/:id", auth, roomController.deleteRoom);



// Room messages
router.post("/:id/messages", auth, roomController.postRoomMessages );
router.get("/:id/messages", auth, roomController.getRoomMessages );


module.exports = router;