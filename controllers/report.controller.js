const Report = require('../models/Report');
const User = require('../models/User');

// Report a user
exports.reportUser = async (req, res) => {
  const { reportedUser, reason } = req.body;

  if (reportedUser === req.user.id) return res.status(400).json({ message: "You can't report yourself" });

  const report = await Report.create({ reporter: req.user.id, reportedUser, reason });
  res.status(201).json(report);
};

// Get reports (admin)
exports.getReports = async (req, res) => {
  const reports = await Report.find().populate('reporter', 'username').populate('reportedUser', 'username');
  res.json(reports);
};

// Review report
exports.reviewReport = async (req, res) => {
  await Report.findByIdAndUpdate(req.params.id, { status: 'reviewed' });
  res.json({ message: 'Marked as reviewed' });
};
