import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../state';

const ROLE_SECTIONS = {
  Applicant:     ['overview', 'jobs', 'applications', 'interviews'],
  Recruiter:     ['overview', 'jobs', 'applications', 'interviews'],
  HR:            ['overview', 'jobs', 'applications', 'interviews', 'analytics'],
  HiringManager: ['overview', 'applications', 'interviews'],
  Admin:         ['overview', 'jobs', 'applications', 'analytics', 'users'],
};

const SECTION_META = {
  overview:     { label: 'Overview',     icon: '◈' },
  jobs:         { label: 'Jobs',         icon: '⬡' },
  applications: { label: 'Applications', icon: '📄' },
  interviews:   { label: 'Interviews',   icon: '📅' },
  analytics:    { label: 'Analytics',    icon: '📊' },
  users:        { label: 'User Governance', icon: '🛡️' },
};

const ROLE_COLORS = {
  Admin: 'var(--accent)',
  HR: 'var(--cyan)',
  Recruiter: 'var(--green)',
  HiringManager: 'var(--yellow)',
  Applicant: 'var(--ink2)',
};

function Avatar({ name }) {
  const initials = (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return <div className="avatar">{initials}</div>;
}

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const role = user?.role || 'Applicant';
  const sections = ROLE_SECTIONS[role] || ROLE_SECTIONS.Applicant;

  const handleLogout = () => {
    logout();
    nav('/auth');
  };

  return (
    <div className="dashboard-layout">
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-brand">
          <span style={{ color: 'var(--accent)', fontWeight: 900, fontSize: '1.3rem' }}>⬡</span>
          HireMatrix
          <span style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 8px' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--ink3)', fontFamily: 'var(--font-body)' }}>
            Recruitment Platform
          </span>
        </div>
        <div className="topbar-right">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 14px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
          }}>
            <Avatar name={user?.name} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink)' }}>{user?.name}</div>
              <div style={{ fontSize: '0.72rem', color: ROLE_COLORS[role] || 'var(--ink3)', fontWeight: 600 }}>{role}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-section-label">Navigation</div>
        {sections.map(s => {
          const meta = SECTION_META[s];
          return (
            <NavLink
              key={s}
              to={`/dashboard/${s}`}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span>{meta.icon}</span>
              {meta.label}
            </NavLink>
          );
        })}

        <div style={{ flex: 1 }} />
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
          <div style={{ padding: '10px 12px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
            <div style={{ color: 'var(--ink3)', marginBottom: 4 }}>Logged in as</div>
            <div style={{ color: 'var(--ink2)', fontWeight: 500 }}>{user?.email}</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export { ROLE_SECTIONS };
