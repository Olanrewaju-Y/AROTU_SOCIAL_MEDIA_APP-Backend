const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  isPrivate: { type: Boolean, default: false },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  parentRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  type: { type: String, enum: ['main', 'sub'], default: 'main' }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
