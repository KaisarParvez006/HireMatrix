const User = require('../models/Users');
const Job = require('../models/Jobs');
const Application = require('../models/Applications');
const Interview = require('../models/Interviews');
const { sendMail, approvalTemplate } = require('../utils/mailer');

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch { res.status(500).json({ message: 'Failed to fetch users' }); }
};

const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ['Recruiter', 'HR', 'HiringManager'] },
      approvalStatus: 'Pending',
    }).select('-password');
    res.json(users);
  } catch { res.status(500).json({ message: 'Failed to fetch pending users' }); }
};

const updateApproval = async (req, res) => {
  try {
    const { approvalStatus, rejectionReason } = req.body;
    if (!['Approved', 'Rejected'].includes(approvalStatus))
      return res.status(400).json({ message: 'Invalid approval status' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.approvalStatus = approvalStatus;
    if (approvalStatus === 'Rejected') user.rejectionReason = rejectionReason || '';
    await user.save();

    // Send approval/rejection email
    await sendMail({
      to: user.email,
      subject: approvalStatus === 'Approved' ? 'HireMatrix — Account Approved' : 'HireMatrix — Account Not Approved',
      html: approvalTemplate({ name: user.name, approved: approvalStatus === 'Approved', reason: rejectionReason }),
      text: approvalStatus === 'Approved'
        ? 'Your HireMatrix account has been approved. You can now log in.'
        : 'Your HireMatrix account was not approved.' + (rejectionReason ? ' Reason: ' + rejectionReason : ''),
    });

    res.json({ message: 'Approval status updated', user });
  } catch { res.status(500).json({ message: 'Failed to update approval' }); }
};

const updateUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    if (req.body.isActive === false) {
      const jobs = await Job.find({ postedBy: target._id }).select('_id');
      const jobIds = jobs.map(j => j._id);
      const apps = await Application.find({ $or: [{ jobId: { $in: jobIds } }, { applicantId: target._id }] }).select('_id');
      const appIds = apps.map(a => a._id);

      if (jobIds.length) await Job.deleteMany({ _id: { $in: jobIds } });
      if (appIds.length) {
        await Interview.deleteMany({ applicationId: { $in: appIds } });
        await Application.deleteMany({ _id: { $in: appIds } });
      }
      await User.deleteOne({ _id: target._id });
      return res.json({ message: 'User deactivated and deleted', deleted: true });
    }

    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    res.json(updated);
  } catch { res.status(500).json({ message: 'Failed to update user' }); }
};

const getReport = async (req, res) => {
  try {
    const [users, jobs, applications] = await Promise.all([
      User.countDocuments(), Job.countDocuments(), Application.countDocuments(),
    ]);
    const statusBreakdown = await Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const roleBreakdown = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
    res.json({ users, jobs, applications, statusBreakdown, roleBreakdown });
  } catch { res.status(500).json({ message: 'Failed to generate report' }); }
};

module.exports = { getAllUsers, getPendingUsers, updateApproval, updateUser, getReport };
