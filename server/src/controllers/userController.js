const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/Users');
const OTP = require('../models/OTP');
const { sendMail, otpTemplate, welcomeTemplate } = require('../utils/mailer');

const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, skills, experience, companyName, companyWebsite, designation } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ message: 'Name, email, password and role are required' });
    if (role === 'Admin')
      return res.status(403).json({ message: 'Admin accounts cannot be self-registered' });
    if (role === 'Applicant' && !req.file)
      return res.status(400).json({ message: 'Resume is required for applicants' });
    if ((role === 'Recruiter' || role === 'HR') && !companyName)
      return res.status(400).json({ message: 'Company name is required for Recruiter/HR' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const needsApproval = ['Recruiter', 'HR', 'HiringManager'].includes(role);

    const user = await User.create({
      name, email: email.toLowerCase(), password: hashed, role,
      approvalStatus: needsApproval ? 'Pending' : 'Approved',
      emailVerified: false,
      phone: phone || '',
      resume: req.file ? 'uploads/' + req.file.filename : '',
      skills: role === 'Applicant' ? (skills || '').split(',').map(s => s.trim()).filter(Boolean) : [],
      experience: role === 'Applicant' ? experience || '' : '',
      companyDetails: (role === 'Recruiter' || role === 'HR')
        ? { companyName, companyWebsite: companyWebsite || '', designation: designation || '' } : {},
    });

    const otp = generateOTP();
    await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'verify' });
    await OTP.create({ email: email.toLowerCase(), otp, purpose: 'verify' });

    const emailSent = await sendMail({
      to: email,
      subject: 'HireMatrix — Verify your email',
      html: otpTemplate({ name, otp, purpose: 'verify' }),
      text: 'Your HireMatrix verification code: ' + otp + '  (valid 15 minutes)',
    });
    if (!emailSent) console.log('\n OTP for ' + email + ': ' + otp + '\n');

    res.status(201).json({
      message: needsApproval
        ? 'Account created. Please verify your email, then wait for admin approval.'
        : 'Account created. Please verify your email to continue.',
      requiresVerification: true,
      email: email.toLowerCase(),
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Registration failed' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

    const record = await OTP.findOne({ email: email.toLowerCase(), purpose: 'verify', used: false });
    if (!record) return res.status(400).json({ message: 'OTP not found or already used. Request a new one.' });
    if (new Date() > record.expiresAt) return res.status(400).json({ message: 'OTP has expired. Request a new one.' });
    if (record.otp !== String(otp).trim()) return res.status(400).json({ message: 'Incorrect OTP' });

    record.used = true;
    await record.save();

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() }, { emailVerified: true }, { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    await sendMail({
      to: user.email,
      subject: 'Welcome to HireMatrix!',
      html: welcomeTemplate({ name: user.name, role: user.role }),
      text: 'Welcome to HireMatrix, ' + user.name + '! Your account is now verified.',
    });

    const needsApproval = ['Recruiter', 'HR', 'HiringManager'].includes(user.role) && user.approvalStatus !== 'Approved';
    if (needsApproval) {
      return res.json({ message: 'Email verified! Your account is awaiting admin approval.', pendingApproval: true });
    }

    const token = generateToken(user);
    res.json({ message: 'Email verified! Welcome to HireMatrix.', token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Verify email error:', err.message);
    res.status(500).json({ message: 'Verification failed' });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email, purpose = 'verify' } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'No account with that email' });

    const otp = generateOTP();
    await OTP.deleteMany({ email: email.toLowerCase(), purpose });
    await OTP.create({ email: email.toLowerCase(), otp, purpose });

    const emailSent = await sendMail({
      to: email,
      subject: 'HireMatrix — ' + (purpose === 'verify' ? 'Email Verification' : 'Password Reset') + ' Code',
      html: otpTemplate({ name: user.name, otp, purpose }),
      text: 'Your HireMatrix code: ' + otp,
    });
    if (!emailSent) console.log('\n OTP for ' + email + ': ' + otp + '\n');

    res.json({ message: 'OTP sent to your email address.' });
  } catch (err) {
    console.error('Resend OTP error:', err.message);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.json({ message: 'If that email is registered, you will receive a reset code.' });

    const otp = generateOTP();
    await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'reset' });
    await OTP.create({ email: email.toLowerCase(), otp, purpose: 'reset' });

    const emailSent = await sendMail({
      to: email,
      subject: 'HireMatrix — Password Reset Code',
      html: otpTemplate({ name: user.name, otp, purpose: 'reset' }),
      text: 'Your HireMatrix password reset code: ' + otp + '  (valid 15 minutes)',
    });
    if (!emailSent) console.log('\n Reset OTP for ' + email + ': ' + otp + '\n');

    res.json({ message: 'If that email is registered, you will receive a reset code.' });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ message: 'Failed to process request' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: 'Email, OTP and new password required' });
    if (newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const record = await OTP.findOne({ email: email.toLowerCase(), purpose: 'reset', used: false });
    if (!record) return res.status(400).json({ message: 'OTP not found or already used' });
    if (new Date() > record.expiresAt) return res.status(400).json({ message: 'OTP has expired' });
    if (record.otp !== String(otp).trim()) return res.status(400).json({ message: 'Incorrect OTP' });

    record.used = true;
    await record.save();

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email: email.toLowerCase() }, { password: hashed });

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ message: 'Password reset failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ message: 'Account has been deactivated' });

    if (!user.emailVerified) {
      const otp = generateOTP();
      await OTP.deleteMany({ email: user.email, purpose: 'verify' });
      await OTP.create({ email: user.email, otp, purpose: 'verify' });
      const emailSent = await sendMail({
        to: user.email,
        subject: 'HireMatrix — Verify your email',
        html: otpTemplate({ name: user.name, otp, purpose: 'verify' }),
        text: 'Your HireMatrix verification code: ' + otp,
      });
      if (!emailSent) console.log('\n OTP for ' + user.email + ': ' + otp + '\n');

      return res.status(403).json({
        message: 'Please verify your email first. A new code has been sent.',
        requiresVerification: true,
        email: user.email,
      });
    }

    if (['Recruiter', 'HR', 'HiringManager'].includes(user.role) && user.approvalStatus !== 'Approved') {
      const msg = user.approvalStatus === 'Rejected'
        ? 'Account rejected' + (user.rejectionReason ? ': ' + user.rejectionReason : '.')
        : 'Account pending admin approval.';
      return res.status(403).json({ message: msg });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const token = generateToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Login failed' });
  }
};

const getMe = async (req, res) => res.json(req.user);

module.exports = { register, login, verifyEmail, resendOtp, forgotPassword, resetPassword, getMe };
