const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },

  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Please use a valid email address']
  },

  phone: { type: String, trim: true },
  password: { type: String, required: true, minlength: 8 },
  isAdmin: { type: Boolean, default: false },

  // Profile
  birthday: Date,
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
  location: String,
  relationshipStatus: {
    type: String,
    enum: ['single', 'in a relationship', 'complicated', 'married'],
    default: 'single'
  },
  lookingFor: String,
  level: {
    type: String,
    enum: ['jjc', 'newbie', 'intermediate', 'pro', 'expert'],
    default: 'jjc'
  },
  roomNickname: String,
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  status: { type: String, default: "Hey there! I'm using Arotu." },

  // Social
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // New: Friend request system
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // incoming
  sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],   // outgoing

  // Typing status (for real-time UI)
  typingTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // users they're typing to

  // Notifications
  notificationToken: { type: String }, // push notification device token

  // Presence
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date }

}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
