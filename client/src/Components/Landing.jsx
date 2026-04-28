import { Link } from 'react-router-dom';

const features = [
  { icon: '🎯', title: 'Smart Job Posting', desc: 'Recruiters and HR can post detailed jobs with requirements, deadlines, and job types in seconds.' },
  { icon: '📋', title: 'Application Tracking', desc: 'Full application pipeline from Applied → Shortlisted → Interview → Selected with audit trail.' },
  { icon: '🔐', title: 'Role-Based Access', desc: 'Applicants, Recruiters, HR, Hiring Managers, and Admins each get a tailored experience.' },
  { icon: '📅', title: 'Interview Scheduling', desc: 'Schedule interviews with type, date, interviewer and feedback capture built in.' },
  { icon: '📊', title: 'Recruitment Analytics', desc: 'Admins and HR get reports on users, jobs, applications and pipeline health.' },
  { icon: '🛡️', title: 'Admin Governance', desc: 'Full admin control over user approvals, account management and platform oversight.' },
];

const steps = [
  { num: '01', title: 'Register & Set Up', desc: 'Create your account with your role. Applicants upload resumes; companies verify company details.' },
  { num: '02', title: 'Browse or Post Jobs', desc: 'Applicants discover open roles. Recruiters post detailed job listings instantly.' },
  { num: '03', title: 'Apply & Track', desc: 'Apply with one click and track your application through every stage in real-time.' },
  { num: '04', title: 'Get Hired', desc: 'Interview scheduling, feedback, and final selection — all within HireMatrix.' },
];

export default function Landing() {
  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-nav-brand">
          <span style={{ color: 'var(--accent)', fontWeight: 900 }}>⬡</span>
          HireMatrix
        </div>
        <div className="landing-nav-links">
          <a href="#features" className="btn btn-ghost btn-sm">Features</a>
          <a href="#how" className="btn btn-ghost btn-sm">How it Works</a>
          <Link to="/auth" className="btn btn-sm">Get Started →</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-eyebrow">
          <span>✦</span> Smart Recruitment Platform
        </div>
        <h1>
          Hire Smarter.<br />
          <span className="highlight">Move Faster.</span>
        </h1>
        <p className="hero-sub">
          HireMatrix connects applicants, recruiters, and hiring teams in one unified platform — from job posting to final offer.
        </p>
        <div className="hero-actions">
          <Link to="/auth" className="btn btn-lg">Launch HireMatrix →</Link>
          <a href="#features" className="btn btn-ghost btn-lg">Explore Features</a>
        </div>

        {/* Floating stats */}
        <div style={{ display: 'flex', gap: 16, marginTop: 60, flexWrap: 'wrap', justifyContent: 'center', animation: 'fadeUp 0.6s ease 0.5s both' }}>
          {[
            { num: '5 Roles', label: 'Fully Supported' },
            { num: 'MVC', label: 'Architecture' },
            { num: 'JWT Auth', label: 'Secured' },
            { num: 'MongoDB', label: 'Powered' },
          ].map(s => (
            <div key={s.num} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '14px 20px', textAlign: 'center', minWidth: 120
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--ink)' }}>{s.num}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="features-section" id="features">
        <h2>Everything Your Hiring Team Needs</h2>
        <div className="features-grid">
          {features.map(f => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h4>{f.title}</h4>
              <p style={{ fontSize: '0.875rem', marginTop: 6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="features-section" id="how">
        <h2>How It Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
          {steps.map((s, i) => (
            <div key={s.num} style={{ position: 'relative', padding: '28px 24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 900, color: 'rgba(124,92,252,0.15)', marginBottom: 12 }}>{s.num}</div>
              <h4 style={{ marginBottom: 8 }}>{s.title}</h4>
              <p style={{ fontSize: '0.875rem' }}>{s.desc}</p>
              {i < steps.length - 1 && (
                <div style={{ position: 'absolute', top: '50%', right: -13, width: 24, height: 24, background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', zIndex: 1, transform: 'translateY(-50%)' }}>→</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 40px', textAlign: 'center', background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ marginBottom: 16 }}>Ready to Transform Hiring?</h2>
        <p style={{ marginBottom: 32, fontSize: '1rem' }}>Join HireMatrix and streamline your entire recruitment process.</p>
        <Link to="/auth" className="btn btn-lg">Get Started for Free →</Link>
      </section>

      {/* Footer */}
      <footer style={{ padding: '28px 40px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--ink)' }}>⬡ HireMatrix</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--ink3)' }}>© 2025 HireMatrix. Built with React, Node.js, Express & MongoDB.</div>
      </footer>
    </div>
  );
}
