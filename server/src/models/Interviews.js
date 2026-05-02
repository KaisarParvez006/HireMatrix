const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  scheduledDate: { type: Date, required: true },
  interviewType: { type: String, enum: ['Technical', 'HR', 'Cultural Fit', 'Final'], default: 'Technical' },
  interviewerName: { type: String, default: '' },
  meetLink: { type: String, default: '' },
  feedback: { type: String, default: '' },
  result: { type: String, enum: ['Pending', 'Pass', 'Fail'], default: 'Pending' },
  scheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
