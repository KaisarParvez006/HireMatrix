import { useEffect, useState } from 'react';
import api from '../api';
import { useToast } from '../Components/Toast';
import StatusBadge from '../Components/StatusBadge';

const BAR_COLORS = {
  Applied: '#6b7280', 'Under Review': '#3b82f6', Shortlisted: '#06b6d4',
  'Interview Scheduled': '#8b5cf6', Selected: '#22c55e', Rejected: '#ef4444', 'Not Shortlisted': '#f59e0b',
};

function BarChart({ data, max }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map(({ label, value, color }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 140, fontSize: '0.8rem', color: 'var(--ink2)', textAlign: 'right', flexShrink: 0 }}>{label}</div>
          <div style={{ flex: 1, height: 28, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${max ? (value / max) * 100 : 0}%`,
              background: color || 'var(--accent)',
              borderRadius: 4, minWidth: value > 0 ? 28 : 0,
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              paddingRight: 8, transition: 'width 0.6s ease',
            }}>
              {value > 0 && <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>{value}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const toast = useToast();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/report')
      .then(r => setReport(r.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><span className="spinner" /> Loading analytics...</div>;
  if (!report) return <div className="empty-state"><div className="empty-icon">📊</div><h4>No data yet</h4></div>;

  const statusData = (report.statusBreakdown || []).map(({ _id, count }) => ({
    label: _id, value: count, color: BAR_COLORS[_id] || 'var(--accent)',
  }));
  const maxStatus = Math.max(...statusData.map(d => d.value), 1);

  const roleData = (report.roleBreakdown || []).map(({ _id, count }) => ({
    label: _id, value: count, color: 'var(--accent)',
  }));
  const maxRole = Math.max(...roleData.map(d => d.value), 1);

  const hiringRate = report.applications
    ? Math.round(((report.statusBreakdown?.find(s => s._id === 'Selected')?.count || 0) / report.applications) * 100)
    : 0;

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Analytics</h2>
        <p>Recruitment performance overview and pipeline metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="stat-grid mb-6">
        <div className="stat-card" style={{ borderColor: 'rgba(124,92,252,0.3)' }}>
          <div className="stat-num" style={{ color: 'var(--accent2)' }}>{report.users}</div>
          <div className="stat-label">👥 Total Users</div>
        </div>
        <div className="stat-card" style={{ borderColor: 'rgba(6,182,212,0.3)' }}>
          <div className="stat-num" style={{ color: 'var(--cyan)' }}>{report.jobs}</div>
          <div className="stat-label">⬡ Active Jobs</div>
        </div>
        <div className="stat-card" style={{ borderColor: 'rgba(59,130,246,0.3)' }}>
          <div className="stat-num" style={{ color: 'var(--blue)' }}>{report.applications}</div>
          <div className="stat-label">📄 Total Applications</div>
        </div>
        <div className="stat-card" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
          <div className="stat-num" style={{ color: 'var(--green)' }}>{hiringRate}%</div>
          <div className="stat-label">✓ Selection Rate</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
        {/* Application Pipeline Chart */}
        <div className="card">
          <h4 style={{ marginBottom: 20 }}>Application Pipeline</h4>
          {statusData.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <p>No application data yet</p>
            </div>
          ) : (
            <BarChart data={statusData} max={maxStatus} />
          )}
        </div>

        {/* User Role Distribution */}
        <div className="card">
          <h4 style={{ marginBottom: 20 }}>User Distribution by Role</h4>
          {roleData.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <p>No user data yet</p>
            </div>
          ) : (
            <BarChart data={roleData} max={maxRole} />
          )}
        </div>
      </div>

      {/* Status breakdown table */}
      {statusData.length > 0 && (
        <div className="card mt-4">
          <h4 style={{ marginBottom: 16 }}>Detailed Status Breakdown</h4>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Count</th>
                  <th>Percentage</th>
                  <th>Visual</th>
                </tr>
              </thead>
              <tbody>
                {statusData.map(d => (
                  <tr key={d.label}>
                    <td><StatusBadge status={d.label} /></td>
                    <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)' }}>{d.value}</td>
                    <td style={{ color: 'var(--ink2)' }}>{report.applications ? Math.round((d.value / report.applications) * 100) : 0}%</td>
                    <td>
                      <div style={{ width: 120, height: 8, background: 'var(--bg3)', borderRadius: 4 }}>
                        <div style={{ height: '100%', width: `${report.applications ? (d.value / report.applications) * 100 : 0}%`, background: d.color, borderRadius: 4 }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
