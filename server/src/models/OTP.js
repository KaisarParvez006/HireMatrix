const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true },
  otp: { type: String, required: true },
  purpose: { type: String, enum: ['verify', 'reset'], required: true },
  expiresAt: { type: Date, required: true, default: () => new Date(Date.now() + 15 * 60 * 1000) },
  used: { type: Boolean, default: false },
}, { timestamps: true });

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OTP', otpSchema);
