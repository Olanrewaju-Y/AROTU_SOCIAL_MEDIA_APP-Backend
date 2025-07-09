const Notification = require('../models/Notification');

// Get notifications
exports.getMyNotifications = async (req, res) => {
  const notes = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json(notes);
};

// Mark as read
exports.markAsRead = async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ message: 'Marked as read' });
};
