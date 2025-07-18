const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  isPrivate: { type: Boolean, default: false },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // New field for admins
  parentRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  messages: [messageSchema],
  type: { type: String, enum: ['main', 'sub'], default: 'main' }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);

