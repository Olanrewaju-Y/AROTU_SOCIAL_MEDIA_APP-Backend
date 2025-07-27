const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  avatar: { type: String, default: '' },
  isPublic: { type: Boolean, default: true },
  isPrivate: { type: Boolean, default: false },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  parentRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  type: { type: String, enum: ['main', 'sub'], default: 'main' },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
