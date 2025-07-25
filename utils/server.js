const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');




// handle isOnline
const handleOnlineStatus = (userId, isOnline) => {
  return mongoose.model('User').findByIdAndUpdate(userId, { isOnline, lastSeen: isOnline ? null : new Date() }, { new: true });
};

// handle lastSeen
const handleLastSeen = (userId) => {
  return mongoose.model('User').findByIdAndUpdate(userId, { lastSeen: new Date() }, { new: true });
};
// handle notifications
const handleNotificationToken = (userId, token) => {
  return mongoose.model('User').findByIdAndUpdate(userId, { notificationToken: token }, { new: true });
};

// handle typing status
const handleTypingStatus = (userId, typingTo) => {
  return mongoose.model('User').findByIdAndUpdate(userId, { typingTo }, { new: true });
};



module.exports = {
  handleOnlineStatus,
    handleLastSeen,
    handleNotificationToken,
    handleTypingStatus
};
