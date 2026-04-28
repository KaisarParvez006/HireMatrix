const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Applicant', 'Recruiter', 'HR', 'HiringManager', 'Admin'], default: 'Applicant' },
  approvalStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Approved' },
  emailVerified: { type: Boolean, default: false },
  phone: { type: String, default: '' },
  resume: { type: String, default: '' },
  skills: { type: [String], default: [] },
  experience: { type: String, default: '' },
  companyDetails: {
    companyName: { type: String, default: '' },
    companyWebsite: { type: String, default: '' },
    designation: { type: String, default: '' },
  },
  isActive: { type: Boolean, default: true },
  rejectionReason: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
