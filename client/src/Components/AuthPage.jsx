import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../state';
import { useToast } from './Toast';
import api from '../api';

const ROLES = ['Applicant', 'Recruiter', 'HR', 'HiringManager'];

// ─── OTP VERIFY SCREEN ──────────────────────────────────────────────────────
function OTPVerifyScreen({ email, onVerified, onBack }) {
  const toast = useToast();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const verify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-email', { email, otp });
      toast.success(data.message);
      if (data.pendingApproval) {
        onBack('login');
      } else {
        onVerified(data);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Verification failed');
    } finally { setLoading(false); }
  };

  const resend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email, purpose: 'verify' });
      toast.success('New code sent to ' + email);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to resend');
    } finally { setResending(false); }
  };

  return (
    <div className="auth-card">
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => onBack('login')} style={{ background: 'none', border: 'none', color: 'var(--ink3)', cursor: 'pointer', fontSize: '1.1rem' }}>←</button>
        <h2 style={{ margin: 0 }}>Check your inbox</h2>
      </div>
      <p className="auth-sub">We sent a 6-digit verification code to <strong style={{ color: 'var(--ink)' }}>{email}</strong></p>

      <div style={{ padding: '12px 14px', background: 'var(--yellow-bg)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--yellow)', marginBottom: 20 }}>
        💡 No real email configured — check the server console for the OTP code.
      </div>

      <form onSubmit={verify} className="auth-stack">
        <div className="form-group">
          <label>6-Digit Code</label>
          <input
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            maxLength={6}
            style={{ fontSize: '1.5rem', letterSpacing: '0.3em', textAlign: 'center', fontFamily: 'monospace' }}
            autoFocus
          />
        </div>
        <button className="btn btn-lg" type="submit" disabled={loading || otp.length !== 6}>
          {loading ? <><span className="spinner" /> Verifying...</> : 'Verify Email →'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 16, fontSize: '0.875rem', color: 'var(--ink3)' }}>
        Didn't receive it?{' '}
        <button onClick={resend} disabled={resending} style={{ background: 'none', border: 'none', color: 'var(--accent2)', cursor: 'pointer', fontWeight: 600 }}>
          {resending ? 'Sending...' : 'Resend code'}
        </button>
      </div>
    </div>
  );
}

// ─── FORGOT PASSWORD SCREEN ──────────────────────────────────────────────────
function ForgotPasswordScreen({ onBack }) {
  const toast = useToast();
  const [step, setStep] = useState('request'); // request | otp | newpass
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const requestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      toast.info(data.message);
      setStep('otp');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send reset code');
    } finally { setLoading(false); }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    setStep('newpass');
  };

  const doReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { email, otp, newPassword });
      toast.success(data.message);
      onBack('login');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-card">
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => onBack('login')} style={{ background: 'none', border: 'none', color: 'var(--ink3)', cursor: 'pointer', fontSize: '1.1rem' }}>←</button>
        <h2 style={{ margin: 0 }}>
          {step === 'request' ? 'Forgot password' : step === 'otp' ? 'Enter reset code' : 'New password'}
        </h2>
      </div>

      {step === 'request' && (
        <form onSubmit={requestReset} className="auth-stack">
          <p className="auth-sub">Enter your email and we'll send a reset code.</p>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />
          </div>
          <button className="btn btn-lg" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" /> Sending...</> : 'Send Reset Code →'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <>
          <div style={{ padding: '12px 14px', background: 'var(--yellow-bg)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--yellow)', marginBottom: 20 }}>
            💡 Check server console for reset code (dev mode).
          </div>
          <form onSubmit={verifyOtp} className="auth-stack">
            <p className="auth-sub">Enter the 6-digit code sent to <strong style={{ color: 'var(--ink)' }}>{email}</strong></p>
            <div className="form-group">
              <label>Reset Code</label>
              <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456"
                style={{ fontSize: '1.5rem', letterSpacing: '0.3em', textAlign: 'center', fontFamily: 'monospace' }} maxLength={6} autoFocus />
            </div>
            <button className="btn btn-lg" type="submit" disabled={otp.length !== 6}>Continue →</button>
          </form>
        </>
      )}

      {step === 'newpass' && (
        <form onSubmit={doReset} className="auth-stack">
          <div className="form-group">
            <label>New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" required />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" required />
          </div>
          <button className="btn btn-lg" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" /> Resetting...</> : 'Reset Password →'}
          </button>
        </form>
      )}
    </div>
  );
}

// ─── MAIN AUTH PAGE ──────────────────────────────────────────────────────────
export default function AuthPage() {
  const { login, register } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  // screen: 'login' | 'register' | 'verify' | 'forgot'
  const [screen, setScreen] = useState('login');
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'Applicant',
    phone: '', skills: '', experience: '',
    companyName: '', companyWebsite: '', designation: '',
    resume: null,
  });

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success('Welcome back, ' + data.user.name + '!');
      nav('/dashboard/overview');
    } catch (err) {
      const resp = err?.response?.data;
      if (resp?.requiresVerification) {
        setPendingEmail(resp.email || form.email);
        setScreen('verify');
        toast.info('Please verify your email first');
      } else {
        toast.error(resp?.message || 'Login failed');
      }
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.role === 'Applicant' && !form.resume) { toast.error('Resume is required for applicants'); return; }
    if ((form.role === 'Recruiter' || form.role === 'HR') && !form.companyName.trim()) { toast.error('Company name is required'); return; }
    setLoading(true);
    try {
      const data = await register(form);
      if (data?.requiresVerification) {
        setPendingEmail(data.email || form.email);
        setScreen('verify');
        toast.success('Account created! Check your email for the verification code.');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const handleVerified = (data) => {
    if (data.token) {
      localStorage.setItem('hm_token', data.token);
      localStorage.setItem('hm_user', JSON.stringify(data.user));
      window.location.href = '/dashboard/overview';
    }
  };

  if (screen === 'verify') {
    return (
      <div className="auth-page">
        <BackBrand />
        <OTPVerifyScreen email={pendingEmail} onVerified={handleVerified} onBack={setScreen} />
      </div>
    );
  }

  if (screen === 'forgot') {
    return (
      <div className="auth-page">
        <BackBrand />
        <ForgotPasswordScreen onBack={setScreen} />
      </div>
    );
  }

  return (
    <div className="auth-page">
      <BackBrand />
      <div className="auth-card">
        <h2 style={{ marginBottom: 4 }}>{screen === 'login' ? 'Welcome back' : 'Create account'}</h2>
        <p className="auth-sub">{screen === 'login' ? 'Sign in to your HireMatrix workspace' : 'Join the smart recruitment platform'}</p>

        <form onSubmit={screen === 'login' ? handleLogin : handleRegister} className="auth-stack">
          {screen === 'register' && (
            <div className="form-group">
              <label>Full Name</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Alex Johnson" required />
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@company.com" required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" required />
          </div>

          {screen === 'register' && (
            <>
              <div className="form-group">
                <label>I am a...</label>
                <select value={form.role} onChange={e => set('role', e.target.value)}>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Phone (optional)</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 9876543210" />
              </div>

              {form.role === 'Applicant' && (
                <>
                  <div className="form-group">
                    <label>Resume <span style={{ color: 'var(--red)' }}>*</span></label>
                    <input type="file" accept=".pdf,.doc,.docx" onChange={e => set('resume', e.target.files?.[0] || null)} required />
                    <span style={{ fontSize: '0.75rem', color: 'var(--ink3)' }}>PDF, DOC or DOCX — max 5MB</span>
                  </div>
                  <div className="form-group">
                    <label>Skills (comma separated)</label>
                    <input value={form.skills} onChange={e => set('skills', e.target.value)} placeholder="React, Node.js, MongoDB..." />
                  </div>
                  <div className="form-group">
                    <label>Experience</label>
                    <input value={form.experience} onChange={e => set('experience', e.target.value)} placeholder="2 years in Full-Stack Development" />
                  </div>
                </>
              )}

              {(form.role === 'Recruiter' || form.role === 'HR') && (
                <>
                  <div className="form-group">
                    <label>Company Name <span style={{ color: 'var(--red)' }}>*</span></label>
                    <input value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Acme Corp" required />
                  </div>
                  <div className="form-group">
                    <label>Company Website</label>
                    <input value={form.companyWebsite} onChange={e => set('companyWebsite', e.target.value)} placeholder="https://acmecorp.com" />
                  </div>
                  <div className="form-group">
                    <label>Your Designation</label>
                    <input value={form.designation} onChange={e => set('designation', e.target.value)} placeholder="Senior Recruiter" />
                  </div>
                  <ApprovalNotice />
                </>
              )}

              {form.role === 'HiringManager' && <ApprovalNotice />}
            </>
          )}

          {screen === 'login' && (
            <div style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--ink3)' }}>
              <strong style={{ color: 'var(--ink2)' }}>Admin demo:</strong> admin@hirematrix.com / admin123
            </div>
          )}

          <button className="btn btn-lg" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? <><span className="spinner" /> Processing...</> : screen === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>
        </form>

        {screen === 'login' && (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button onClick={() => setScreen('forgot')} style={{ background: 'none', border: 'none', color: 'var(--ink3)', cursor: 'pointer', fontSize: '0.8rem' }}>
              Forgot password?
            </button>
          </div>
        )}

        <div className="auth-toggle">
          {screen === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setScreen(screen === 'login' ? 'register' : 'login')}>
            {screen === 'login' ? 'Register' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BackBrand() {
  return (
    <div style={{ position: 'absolute', top: 20, left: 20 }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink2)', textDecoration: 'none', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
        <span style={{ color: 'var(--accent)' }}>⬡</span> HireMatrix
      </Link>
    </div>
  );
}

function ApprovalNotice() {
  return (
    <div style={{ padding: '12px 14px', background: 'var(--yellow-bg)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--yellow)' }}>
      ⚠ This account type requires admin approval before you can log in.
    </div>
  );
}
