const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },         // receiver
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },       // actor
  type: { type: String, enum: ['like', 'comment', 'message'], required: true },
  content: { type: String },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
