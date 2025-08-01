const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String },
  image: { type: String },
  visibility: { type: String, enum: ['public', 'friends', 'followers', 'onlyMe'], default: 'public' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
