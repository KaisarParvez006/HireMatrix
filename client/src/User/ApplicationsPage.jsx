import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../state';
import { useToast } from '../Components/Toast';
import StatusBadge from '../Components/StatusBadge';

const STATUSES = ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected', 'Not Shortlisted'];

const RECRUITER_ACTIONS = {
  Applied: ['Under Review', 'Shortlisted', 'Not Shortlisted', 'Rejected'],
  'Under Review': ['Shortlisted', 'Not Shortlisted', 'Rejected'],
  Shortlisted: ['Interview Scheduled', 'Rejected'],
  'Interview Scheduled': ['Selected', 'Rejected'],
};

const STATUS_TRACK = ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected'];

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

export default function Applications() {
  const { user } = useAuth();
  const toast = useToast();
  const role = user?.role;

  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [scheduleModal, setScheduleModal] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ scheduledDate: '', interviewType: 'Technical', interviewerName: '', meetLink: '' });

  const load = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (jobFilter && role !== 'Applicant') params.jobId = jobFilter;

      const [a, j] = await Promise.all([
        api.get('/applications', { params }),
        role !== 'Applicant' ? api.get('/jobs') : Promise.resolve({ data: [] }),
      ]);
      setApps(a.data);
      setJobs(j.data);
    } catch { toast.error('Failed to load applications'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter, jobFilter]);

  const updateStatus = async (app) => {
    if (!newStatus) { toast.error('Select a status'); return; }
    try {
      await api.patch(`/applications/${app._id}/status`, { status: newStatus, statusReason });
      toast.success(`Status updated to ${newStatus}`);
      setSelectedApp(null);
      setNewStatus('');
      setStatusReason('');
      load();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to update status'); }
  };

  const scheduleInterview = async () => {
    if (!scheduleForm.scheduledDate) { toast.error('Select a date and time'); return; }
    try {
      await api.post('/interviews', { applicationId: scheduleModal._id, ...scheduleForm });
      toast.success('Interview scheduled!');
      setScheduleModal(null);
      setScheduleForm({ scheduledDate: '', interviewType: 'Technical', interviewerName: '', meetLink: '' });
      load();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to schedule'); }
  };

  const filtered = apps.filter(a => {
    const term = search.toLowerCase();
    return !term || a.jobId?.title?.toLowerCase().includes(term) || a.applicantId?.name?.toLowerCase().includes(term);
  });

  if (loading) return <div className="loading-screen"><span className="spinner" /> Loading applications...</div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Applications</h2>
        <p>{role === 'Applicant' ? 'Track your job applications' : 'Review and manage candidate applications'}</p>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search by job or candidate..." style={{ flex: 2 }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        {role !== 'Applicant' && (
          <select value={jobFilter} onChange={e => setJobFilter(e.target.value)}>
            <option value="">All jobs</option>
            {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
          </select>
        )}
        <span style={{ color: 'var(--ink3)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{filtered.length} results</span>
      </div>

      {/* Applications */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h4>{role === 'Applicant' ? "No applications yet" : "No applications found"}</h4>
          <p>{role === 'Applicant' ? 'Head to Jobs to apply for open positions.' : 'Applications will appear here once candidates apply.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(app => (
            <div className="app-card" key={app._id}>
              <div className="app-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                    {role === 'Applicant' ? '⬡' : '👤'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.95rem' }}>
                      {role === 'Applicant' ? app.jobId?.title : app.applicantId?.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--ink3)' }}>
                      {role === 'Applicant'
                        ? `${app.jobId?.company || ''} · Applied ${new Date(app.appliedAt).toLocaleDateString()}`
                        : `${app.applicantId?.email || ''} · ${app.jobId?.title || ''}`}
                    </div>
                  </div>
                </div>
                <StatusBadge status={app.status} />
              </div>

              {/* Status tracker for applicants */}
              {role === 'Applicant' && !['Rejected', 'Not Shortlisted'].includes(app.status) && (
                <div className="status-track" style={{ margin: '10px 0' }}>
                  {STATUS_TRACK.map(s => (
                    <div key={s} className={`status-step ${app.status === s ? 'active' : STATUS_TRACK.indexOf(s) < STATUS_TRACK.indexOf(app.status) ? 'done' : ''}`}>
                      {s.replace(' ', '\n')}
                    </div>
                  ))}
                </div>
              )}

              <div className="app-card-body">
                {role !== 'Applicant' && app.applicantId?.skills?.length > 0 && (
                  <div className="app-card-field">
                    <span>Skills</span>
                    <div className="chip-list" style={{ marginTop: 0 }}>
                      {app.applicantId.skills.slice(0, 4).map((s, i) => <span key={i} className="chip">{s}</span>)}
                    </div>
                  </div>
                )}
                {app.statusReason && (
                  <div className="app-card-field">
                    <span>Notes</span>
                    <span>{app.statusReason}</span>
                  </div>
                )}
                {role !== 'Applicant' && app.applicantId?.experience && (
                  <div className="app-card-field">
                    <span>Experience</span>
                    <span>{app.applicantId.experience}</span>
                  </div>
                )}
              </div>

              <div className="app-card-actions">
                {app.resume && app.resume !== 'no-resume' && (
                  <a href={`/${app.resume}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">📎 Resume</a>
                )}
                {['Recruiter', 'HR', 'Admin'].includes(role) && (
                  <>
                    <button className="btn btn-sm btn-ghost" onClick={() => { setSelectedApp(app); setNewStatus(''); setStatusReason(''); }}>Update Status</button>
                    {['Applied', 'Under Review', 'Shortlisted'].includes(app.status) && (
                      <button className="btn btn-sm" onClick={() => setScheduleModal(app)}>📅 Schedule Interview</button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status Update Modal */}
      {selectedApp && (
        <Modal title={`Update — ${selectedApp.applicantId?.name || selectedApp.jobId?.title}`} onClose={() => setSelectedApp(null)}>
          <div className="stack">
            <div style={{ padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink3)', marginBottom: 4 }}>Current Status</div>
              <StatusBadge status={selectedApp.status} />
            </div>
            <div className="form-group">
              <label>New Status</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                <option value="">— Select status —</option>
                {(RECRUITER_ACTIONS[selectedApp.status] || []).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Reason / Notes (optional)</label>
              <textarea value={statusReason} onChange={e => setStatusReason(e.target.value)} placeholder="Reason for status change..." />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setSelectedApp(null)}>Cancel</button>
              <button className="btn" onClick={() => updateStatus(selectedApp)}>Update Status</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Schedule Interview Modal */}
      {scheduleModal && (
        <Modal title="Schedule Interview" onClose={() => setScheduleModal(null)}>
          <div className="stack">
            <div style={{ padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
              Scheduling interview for <strong style={{ color: 'var(--ink)' }}>{scheduleModal.applicantId?.name}</strong>
              {' '}for <strong style={{ color: 'var(--ink)' }}>{scheduleModal.jobId?.title}</strong>
            </div>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label>Date & Time *</label>
                <input type="datetime-local" value={scheduleForm.scheduledDate} onChange={e => setScheduleForm(p => ({ ...p, scheduledDate: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Interview Type</label>
                <select value={scheduleForm.interviewType} onChange={e => setScheduleForm(p => ({ ...p, interviewType: e.target.value }))}>
                  {['Technical', 'HR', 'Cultural Fit', 'Final'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Interviewer Name</label>
              <input value={scheduleForm.interviewerName} onChange={e => setScheduleForm(p => ({ ...p, interviewerName: e.target.value }))} placeholder="John Smith" />
            </div>
            <div className="form-group">
              <label>Meet Link (optional)</label>
              <input value={scheduleForm.meetLink} onChange={e => setScheduleForm(p => ({ ...p, meetLink: e.target.value }))} placeholder="https://meet.google.com/..." />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setScheduleModal(null)}>Cancel</button>
              <button className="btn" onClick={scheduleInterview}>Schedule →</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
