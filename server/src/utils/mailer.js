const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const emailEnabled = process.env.EMAIL_ENABLED !== 'false';

  if (!emailEnabled || !process.env.SMTP_USER || process.env.SMTP_USER === 'your_gmail@gmail.com') {
    // Console-only mode for development
    transporter = {
      sendMail: async (opts) => {
        console.log('\n📧 ====== EMAIL (DEV MODE - not sent) ======');
        console.log('To:', opts.to);
        console.log('Subject:', opts.subject);
        if (opts.text) console.log('Body:', opts.text);
        console.log('==========================================\n');
        return { messageId: 'dev-mode' };
      },
    };
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

const sendMail = async ({ to, subject, html, text }) => {
  try {
    const mailer = getTransporter();
    const from = process.env.EMAIL_FROM || 'HireMatrix <noreply@hirematrix.com>';
    await mailer.sendMail({ from, to, subject, html, text });
    return true;
  } catch (err) {
    console.error('Email send failed:', err.message);
    return false;
  }
};

// ======= EMAIL TEMPLATES =======

const otpTemplate = ({ name, otp, purpose }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { margin:0; padding:0; background:#0a0a0f; font-family: 'Segoe UI', sans-serif; }
    .wrapper { max-width:560px; margin:0 auto; padding:40px 20px; }
    .card { background:#1a1a26; border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:40px; }
    .brand { font-size:1.4rem; font-weight:900; color:#a78bfa; margin-bottom:28px; letter-spacing:-0.02em; }
    .brand span { color:#f0f0f8; }
    h2 { color:#f0f0f8; margin:0 0 12px; font-size:1.3rem; }
    p { color:#9898b0; font-size:0.95rem; line-height:1.6; margin:0 0 20px; }
    .otp-box { background:#0a0a0f; border:2px solid #7c5cfc; border-radius:12px; padding:24px; text-align:center; margin:24px 0; }
    .otp-code { font-size:2.4rem; font-weight:900; color:#a78bfa; letter-spacing:0.15em; font-family:monospace; }
    .otp-label { color:#5a5a70; font-size:0.78rem; margin-top:8px; text-transform:uppercase; letter-spacing:0.1em; }
    .footer { margin-top:28px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.07); color:#5a5a70; font-size:0.78rem; }
    .warning { background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.2); border-radius:8px; padding:12px 16px; color:#f59e0b; font-size:0.82rem; margin-top:16px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="brand">⬡ Hire<span>Matrix</span></div>
      <h2>${purpose === 'verify' ? 'Verify your email' : 'Reset your password'}</h2>
      <p>Hi ${name || 'there'},</p>
      <p>${purpose === 'verify'
        ? 'Welcome to HireMatrix! Use the code below to verify your email address and activate your account.'
        : 'We received a password reset request for your account. Use the code below to set a new password.'
      }</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="otp-label">One-Time Password · Valid for 15 minutes</div>
      </div>
      <div class="warning">⚠ Never share this code with anyone. HireMatrix will never ask for it.</div>
      <div class="footer">
        If you didn't request this, you can safely ignore this email.<br/>
        © 2025 HireMatrix · Built with React, Node.js & MongoDB
      </div>
    </div>
  </div>
</body>
</html>`;

const welcomeTemplate = ({ name, role }) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin:0; padding:0; background:#0a0a0f; font-family:'Segoe UI', sans-serif; }
    .wrapper { max-width:560px; margin:0 auto; padding:40px 20px; }
    .card { background:#1a1a26; border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:40px; }
    .brand { font-size:1.4rem; font-weight:900; color:#a78bfa; margin-bottom:28px; }
    .brand span { color:#f0f0f8; }
    h2 { color:#f0f0f8; margin:0 0 12px; font-size:1.5rem; }
    p { color:#9898b0; font-size:0.95rem; line-height:1.6; margin:0 0 16px; }
    .badge { display:inline-block; background:rgba(124,92,252,0.15); color:#a78bfa; border-radius:100px; padding:4px 14px; font-size:0.8rem; font-weight:600; margin-bottom:20px; }
    .features { background:#0a0a0f; border-radius:12px; padding:20px; margin:20px 0; }
    .feature { color:#9898b0; font-size:0.875rem; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.05); }
    .feature:last-child { border-bottom:none; }
    .footer { margin-top:24px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.07); color:#5a5a70; font-size:0.78rem; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="brand">⬡ Hire<span>Matrix</span></div>
      <div class="badge">${role}</div>
      <h2>Welcome, ${name}! 🎉</h2>
      <p>Your HireMatrix account is ready. You're now part of the smart recruitment platform.</p>
      <div class="features">
        ${role === 'Applicant' ? `
          <div class="feature">✓ Browse and apply for open jobs</div>
          <div class="feature">✓ Track your applications in real-time</div>
          <div class="feature">✓ Get notified about interview schedules</div>
        ` : `
          <div class="feature">✓ Post and manage job listings</div>
          <div class="feature">✓ Review candidate applications</div>
          <div class="feature">✓ Schedule and manage interviews</div>
        `}
      </div>
      <p>Log in at <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="color:#a78bfa">${process.env.CLIENT_URL || 'http://localhost:5173'}</a> to get started.</p>
      <div class="footer">© 2025 HireMatrix · Smart Recruitment Platform</div>
    </div>
  </div>
</body>
</html>`;

const approvalTemplate = ({ name, approved, reason }) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin:0; padding:0; background:#0a0a0f; font-family:'Segoe UI', sans-serif; }
    .wrapper { max-width:560px; margin:0 auto; padding:40px 20px; }
    .card { background:#1a1a26; border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:40px; }
    .brand { font-size:1.4rem; font-weight:900; color:#a78bfa; margin-bottom:28px; }
    .brand span { color:#f0f0f8; }
    h2 { color:#f0f0f8; margin:0 0 16px; }
    p { color:#9898b0; font-size:0.95rem; line-height:1.6; margin:0 0 16px; }
    .status { border-radius:12px; padding:16px 20px; margin:20px 0; }
    .status.approved { background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.2); color:#22c55e; }
    .status.rejected { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); color:#ef4444; }
    .footer { margin-top:24px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.07); color:#5a5a70; font-size:0.78rem; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="brand">⬡ Hire<span>Matrix</span></div>
      <h2>${approved ? '✅ Account Approved' : '❌ Account Not Approved'}</h2>
      <p>Hi ${name},</p>
      <div class="status ${approved ? 'approved' : 'rejected'}">
        ${approved
          ? '✓ Your company has been verified. You can now log in to HireMatrix.'
          : `✕ Your account request could not be approved.${reason ? ' Reason: ' + reason : ''}`
        }
      </div>
      ${approved ? `<p>Log in at <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="color:#a78bfa">HireMatrix</a> to start using the platform.</p>` : '<p>If you believe this is a mistake, please contact support.</p>'}
      <div class="footer">© 2025 HireMatrix · Smart Recruitment Platform</div>
    </div>
  </div>
</body>
</html>`;

module.exports = { sendMail, otpTemplate, welcomeTemplate, approvalTemplate };
