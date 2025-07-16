const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  user: { type: String, required: true }, // Or ref to User if needed
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  isPrivate: { type: Boolean, default: false },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // New field for admins
  parentRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
  messages: [messageSchema],
  type: { type: String, enum: ['main', 'sub'], default: 'main' }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
