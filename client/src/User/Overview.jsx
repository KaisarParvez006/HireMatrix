import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../state';
import StatusBadge from '../Components/StatusBadge';

const ROLE_COLORS = {
  Applicant: 'var(--ink2)', Recruiter: 'var(--green)',
  HR: 'var(--cyan)', HiringManager: 'var(--yellow)', Admin: 'var(--accent)',
};

export default function Overview() {
  const { user } = useAuth();
  const role = user?.role;
  const [data, setData] = useState({ jobs: [], apps: [], interviews: [], report: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [j, a, i] = await Promise.all([
          api.get('/jobs'),
          api.get('/applications'),
          api.get('/interviews'),
        ]);
        let report = null;
        if (role === 'Admin' || role === 'HR') {
          const r = await api.get('/admin/report');
          report = r.data;
        }
        setData({ jobs: j.data, apps: a.data, interviews: i.data, report });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [role]);

  if (loading) return (
    <div className="loading-screen">
      <span className="spinner" />
      Loading your workspace...
    </div>
  );

  const { jobs, apps, interviews, report } = data;
  const pipeline = apps.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 4, height: 28, background: ROLE_COLORS[role], borderRadius: 2 }} />
          <h2>Good day, {user?.name?.split(' ')[0]} 👋</h2>
        </div>
        <p style={{ color: 'var(--ink3)', paddingLeft: 16 }}>Here's what's happening in your HireMatrix workspace.</p>
      </div>

      {/* Stats */}
      <div className="stat-grid mb-6">
        <div className="stat-card">
          <div className="stat-num">{jobs.length}</div>
          <div className="stat-label">⬡ Open Jobs</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{apps.length}</div>
          <div className="stat-label">📄 Applications</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{interviews.length}</div>
          <div className="stat-label">📅 Interviews</div>
        </div>
        {(role === 'Admin' || role === 'HR') && report && (
          <div className="stat-card">
            <div className="stat-num">{report.users}</div>
            <div className="stat-label">👥 Total Users</div>
          </div>
        )}
      </div>

      {/* Pipeline */}
      {Object.keys(pipeline).length > 0 && (
        <div className="card mb-6">
          <h4 style={{ marginBottom: 16 }}>Application Pipeline</h4>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.entries(pipeline).map(([status, count]) => (
              <div key={status} style={{
                flex: 1, minWidth: 120,
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '14px 16px',
                textAlign: 'center',
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink)', marginBottom: 6 }}>{count}</div>
                <StatusBadge status={status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Applications */}
      {apps.length > 0 && (
        <div className="card mb-6">
          <h4 style={{ marginBottom: 16 }}>Recent Applications</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {apps.slice(0, 5).map(app => (
              <div key={app._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink)' }}>
                    {app.jobId?.title || 'Job Title'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink3)' }}>
                    {app.applicantId?.name || app.jobId?.company} · {new Date(app.appliedAt).toLocaleDateString()}
                  </div>
                </div>
                <StatusBadge status={app.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role-based info */}
      {(role === 'Admin' || role === 'HR') && report && (
        <div className="card">
          <h4 style={{ marginBottom: 16 }}>Application Status Breakdown</h4>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(report.statusBreakdown || []).map(({ _id, count }) => (
              <div key={_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)' }}>
                <StatusBadge status={_id} />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {apps.length === 0 && jobs.length === 0 && (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div className="empty-icon">🚀</div>
          <h4>Your workspace is ready</h4>
          <p>Head to Jobs to browse open positions or post your first role.</p>
        </div>
      )}
    </div>
  );
}
