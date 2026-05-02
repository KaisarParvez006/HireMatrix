const express = require('express');
const router = express.Router();
const { register, login, verifyEmail, resendOtp, forgotPassword, resetPassword, getMe } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.post('/register', upload.single('resume'), register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
