import { useEffect, useState } from 'react';
import api from '../api';
import { useToast } from '../Components/Toast';
import StatusBadge from '../Components/StatusBadge';

const ROLE_BADGE = {
  Admin: 'badge-purple', HR: 'badge-cyan', Recruiter: 'badge-green',
  HiringManager: 'badge-yellow', Applicant: 'badge-gray',
};

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Avatar({ name }) {
  const initials = (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return <div className="avatar avatar-lg">{initials}</div>;
}

export default function UserGovernance() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    try {
      const [u, p] = await Promise.all([api.get('/admin/users'), api.get('/admin/pending-users')]);
      setUsers(u.data);
      setPending(p.data);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/approval`, { approvalStatus: 'Approved' });
      toast.success('User approved — they can now log in');
      load();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to approve'); }
  };

  const reject = async () => {
    try {
      await api.patch(`/admin/users/${rejectModal._id}/approval`, { approvalStatus: 'Rejected', rejectionReason: rejectReason });
      toast.success('User rejected');
      setRejectModal(null);
      setRejectReason('');
      load();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to reject'); }
  };

  const deactivate = async (u) => {
    if (!window.confirm(`Permanently deactivate and delete ${u.name}? This will also remove their jobs and applications.`)) return;
    try {
      await api.patch(`/admin/users/${u._id}`, { isActive: false });
      toast.success('User deactivated and removed');
      load();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to deactivate'); }
  };

  if (loading) return <div className="loading-screen"><span className="spinner" /> Loading users...</div>;

  const allFiltered = users.filter(u => {
    const term = search.toLowerCase();
    const matchSearch = !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const TabBtn = ({ id, label, count }) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: '8px 18px', borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        background: tab === id ? 'var(--accent)' : 'transparent',
        color: tab === id ? '#fff' : 'var(--ink2)',
        fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.875rem',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
      }}
    >
      {label}
      {count > 0 && (
        <span style={{
          background: tab === id ? 'rgba(255,255,255,0.2)' : 'var(--accent)',
          color: '#fff', borderRadius: 100, padding: '1px 7px', fontSize: '0.72rem',
        }}>{count}</span>
      )}
    </button>
  );

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>User Governance</h2>
        <p>Approve, manage and oversee all platform users</p>
      </div>

      {/* Stats */}
      <div className="stat-grid mb-6">
        <div className="stat-card">
          <div className="stat-num">{users.length}</div>
          <div className="stat-label">👥 Total Users</div>
        </div>
        <div className="stat-card" style={{ borderColor: 'rgba(245,158,11,0.3)' }}>
          <div className="stat-num" style={{ color: 'var(--yellow)' }}>{pending.length}</div>
          <div className="stat-label">⏳ Pending Approval</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{users.filter(u => u.role === 'Applicant').length}</div>
          <div className="stat-label">📄 Applicants</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{users.filter(u => ['Recruiter', 'HR'].includes(u.role)).length}</div>
          <div className="stat-label">🏢 Hiring Staff</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <TabBtn id="pending" label="Pending Approvals" count={pending.length} />
        <TabBtn id="all" label="All Users" count={0} />
      </div>

      {/* Pending Approvals */}
      {tab === 'pending' && (
        pending.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h4>All caught up!</h4>
            <p>No pending approval requests at this time.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {pending.map(u => (
              <div key={u._id} className="card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <Avatar name={u.name} />
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 3, fontFamily: 'var(--font-display)' }}>{u.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--ink3)', marginBottom: 8 }}>{u.email} · {u.phone || 'No phone'}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span className={`badge ${ROLE_BADGE[u.role]}`}>{u.role}</span>
                        <StatusBadge status={u.approvalStatus} />
                        {u.companyDetails?.companyName && (
                          <span className="badge badge-gray">🏢 {u.companyDetails.companyName}</span>
                        )}
                        {u.companyDetails?.designation && (
                          <span className="badge badge-gray">{u.companyDetails.designation}</span>
                        )}
                      </div>
                      {u.companyDetails?.companyWebsite && (
                        <div style={{ marginTop: 8, fontSize: '0.8rem' }}>
                          <a href={u.companyDetails.companyWebsite} target="_blank" rel="noreferrer" style={{ color: 'var(--accent2)' }}>
                            🔗 {u.companyDetails.companyWebsite}
                          </a>
                        </div>
                      )}
                      <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--ink3)' }}>
                        Registered {new Date(u.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-success btn-sm" onClick={() => approve(u._id)}>✓ Approve</button>
                    <button className="btn btn-danger btn-sm" onClick={() => { setRejectModal(u); setRejectReason(''); }}>✕ Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* All Users */}
      {tab === 'all' && (
        <>
          <div className="filter-bar">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search by name or email..." style={{ flex: 2 }} />
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">All roles</option>
              {['Applicant', 'Recruiter', 'HR', 'HiringManager', 'Admin'].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          {allFiltered.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">👥</div><h4>No users found</h4></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Company</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allFiltered.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={u.name} />
                          <div>
                            <div style={{ color: 'var(--ink)', fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</div>
                            <div style={{ color: 'var(--ink3)', fontSize: '0.75rem' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={`badge ${ROLE_BADGE[u.role]}`}>{u.role}</span></td>
                      <td><StatusBadge status={u.approvalStatus} /></td>
                      <td style={{ fontSize: '0.8rem' }}>{u.companyDetails?.companyName || '—'}</td>
                      <td style={{ fontSize: '0.8rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        {u.role !== 'Admin' && (
                          <button className="btn btn-danger btn-sm" onClick={() => deactivate(u)}>
                            Deactivate
                          </button>
                        )}
                        {u.role === 'Admin' && <span style={{ fontSize: '0.75rem', color: 'var(--ink3)' }}>Protected</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <Modal title={`Reject — ${rejectModal.name}`} onClose={() => setRejectModal(null)}>
          <div className="stack">
            <div style={{ padding: '10px 14px', background: 'var(--red-bg)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', color: 'var(--red)' }}>
              This will prevent {rejectModal.name} from logging in with the {rejectModal.role} role.
            </div>
            <div className="form-group">
              <label>Rejection Reason (recommended)</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Company could not be verified, incomplete information..." />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={reject}>Confirm Rejection</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
