const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  media: String
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);