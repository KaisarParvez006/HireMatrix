import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../state';
import { useToast } from '../Components/Toast';
import StatusBadge from '../Components/StatusBadge';

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];

function JobTypeTag({ type }) {
  const colors = { 'Full-time': 'badge-green', 'Part-time': 'badge-blue', Contract: 'badge-yellow', Internship: 'badge-cyan' };
  return <span className={`badge ${colors[type] || 'badge-gray'}`}>{type}</span>;
}

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

export default function Jobs() {
  const { user } = useAuth();
  const toast = useToast();
  const role = user?.role;
  const canPost = ['Recruiter', 'HR', 'Admin'].includes(role);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [detailJob, setDetailJob] = useState(null);
  const [applyingTo, setApplyingTo] = useState(null);
  const [resumeFiles, setResumeFiles] = useState({});
  const [coverLetter, setCoverLetter] = useState('');
  const [appliedJobs, setAppliedJobs] = useState({});

  const [form, setForm] = useState({ title: '', company: '', description: '', requirements: '', location: 'Remote', jobType: 'Full-time', salary: '', deadline: '' });

  const loadJobs = async () => {
    try {
      const [j, a] = await Promise.all([api.get('/jobs'), api.get('/applications')]);
      setJobs(j.data);
      if (role === 'Applicant') {
        const map = {};
        a.data.forEach(app => { if (app.jobId?._id) map[app.jobId._id] = app; });
        setAppliedJobs(map);
      }
    } catch { toast.error('Failed to load jobs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadJobs(); }, []);

  const submitJob = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        requirements: form.requirements.split(',').map(r => r.trim()).filter(Boolean),
        deadline: form.deadline || undefined,
      };
      if (editJob) {
        await api.put(`/jobs/${editJob._id}`, payload);
        toast.success('Job updated');
      } else {
        await api.post('/jobs', payload);
        toast.success('Job posted successfully');
      }
      setForm({ title: '', company: '', description: '', requirements: '', location: 'Remote', jobType: 'Full-time', salary: '', deadline: '' });
      setShowForm(false);
      setEditJob(null);
      loadJobs();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to save job'); }
  };

  const deleteJob = async (job) => {
    if (!window.confirm(`Delete "${job.title}"?`)) return;
    try {
      await api.delete(`/jobs/${job._id}`);
      toast.success('Job deleted');
      loadJobs();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to delete'); }
  };

  const applyJob = async (job) => {
    const f = resumeFiles[job._id];
    if (!f) { toast.error('Please select your resume to apply'); return; }
    const fd = new FormData();
    fd.append('jobId', job._id);
    fd.append('resume', f);
    if (coverLetter) fd.append('coverLetter', coverLetter);
    try {
      await api.post('/applications', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Application submitted!');
      setApplyingTo(null);
      setCoverLetter('');
      loadJobs();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to apply'); }
  };

  const isDeadlinePassed = (d) => d && new Date(d) < new Date();

  const filtered = jobs.filter(j => {
    const term = search.toLowerCase();
    const matchSearch = !term || j.title.toLowerCase().includes(term) || j.company.toLowerCase().includes(term);
    const matchType = !typeFilter || j.jobType === typeFilter;
    return matchSearch && matchType;
  });

  if (loading) return <div className="loading-screen"><span className="spinner" /> Loading jobs...</div>;

  return (
    <div className="animate-in">
      <div className="page-header flex-between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2>Jobs</h2>
          <p>{canPost ? 'Post and manage job listings' : 'Browse and apply for open positions'}</p>
        </div>
        {canPost && (
          <button className="btn" onClick={() => { setEditJob(null); setForm({ title: '', company: '', description: '', requirements: '', location: 'Remote', jobType: 'Full-time', salary: '', deadline: '' }); setShowForm(true); }}>
            + Post Job
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search by title or company..." style={{ flex: 2 }} />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ flex: 1 }}>
          <option value="">All types</option>
          {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <span style={{ color: 'var(--ink3)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{filtered.length} results</span>
      </div>

      {/* Job Cards */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⬡</div>
          <h4>No jobs found</h4>
          <p>{canPost ? 'Post your first job to get started.' : 'Check back soon for new openings.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(job => {
            const applied = appliedJobs[job._id];
            const closed = isDeadlinePassed(job.deadline);

            return (
              <div className="job-card" key={job._id}>
                <div className="job-card-header">
                  <div>
                    <h4 style={{ marginBottom: 2, color: 'var(--ink)' }}>{job.title}</h4>
                    <div style={{ color: 'var(--ink3)', fontSize: '0.875rem' }}>
                      {job.company} · {job.location || 'Remote'}
                    </div>
                  </div>
                  {closed && <span className="badge badge-red">Closed</span>}
                </div>

                <div className="job-card-meta">
                  <JobTypeTag type={job.jobType} />
                  {job.salary && <span className="badge badge-gray">💰 {job.salary}</span>}
                  {job.deadline && <span className="badge badge-gray" style={{ color: closed ? 'var(--red)' : 'var(--ink2)' }}>
                    📅 {new Date(job.deadline).toLocaleDateString()}
                  </span>}
                  <span className="badge badge-gray">📋 {job.requirements?.length || 0} requirements</span>
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--ink2)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {job.description}
                </p>

                {job.requirements?.length > 0 && (
                  <div className="chip-list" style={{ marginTop: 10 }}>
                    {job.requirements.slice(0, 5).map((r, i) => <span key={i} className="chip">{r}</span>)}
                    {job.requirements.length > 5 && <span className="chip">+{job.requirements.length - 5}</span>}
                  </div>
                )}

                <div className="job-card-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => setDetailJob(job)}>View Details</button>

                  {role === 'Applicant' && !applied && !closed && (
                    <button className="btn btn-sm" onClick={() => setApplyingTo(job)}>Apply Now →</button>
                  )}
                  {role === 'Applicant' && applied && (
                    <StatusBadge status={applied.status} />
                  )}
                  {role === 'Applicant' && closed && !applied && (
                    <span className="badge badge-red">Applications Closed</span>
                  )}

                  {canPost && (
                    <>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditJob(job); setForm({ title: job.title, company: job.company, description: job.description, requirements: (job.requirements || []).join(', '), location: job.location || 'Remote', jobType: job.jobType || 'Full-time', salary: job.salary || '', deadline: job.deadline ? new Date(job.deadline).toISOString().slice(0, 10) : '' }); setShowForm(true); }}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteJob(job)}>Delete</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post/Edit Job Modal */}
      {showForm && (
        <Modal title={editJob ? 'Edit Job' : 'Post New Job'} onClose={() => { setShowForm(false); setEditJob(null); }}>
          <form onSubmit={submitJob} className="stack">
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label>Job Title *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Senior Developer" required />
              </div>
              <div className="form-group">
                <label>Company *</label>
                <input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Acme Corp" required />
              </div>
            </div>
            <div className="form-group">
              <label>Description *</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the role, responsibilities..." required />
            </div>
            <div className="form-group">
              <label>Requirements (comma separated)</label>
              <input value={form.requirements} onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))} placeholder="React, Node.js, MongoDB, 3+ years experience" />
            </div>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label>Location</label>
                <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Bengaluru / Remote" />
              </div>
              <div className="form-group">
                <label>Job Type</label>
                <select value={form.jobType} onChange={e => setForm(p => ({ ...p, jobType: e.target.value }))}>
                  {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label>Salary Range</label>
                <input value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} placeholder="₹8-12 LPA" />
              </div>
              <div className="form-group">
                <label>Application Deadline</label>
                <input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setEditJob(null); }}>Cancel</button>
              <button type="submit" className="btn">{editJob ? 'Update Job' : 'Post Job'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Job Detail Modal */}
      {detailJob && (
        <Modal title={detailJob.title} onClose={() => setDetailJob(null)}>
          <div className="stack">
            <div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <JobTypeTag type={detailJob.jobType} />
                <span className="badge badge-gray">{detailJob.location || 'Remote'}</span>
                {detailJob.salary && <span className="badge badge-gray">💰 {detailJob.salary}</span>}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--ink3)' }}>Posted by {detailJob.postedBy?.name || 'Recruiter'}</p>
            </div>
            <div>
              <label style={{ marginBottom: 8, display: 'block' }}>Description</label>
              <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{detailJob.description}</p>
            </div>
            {detailJob.requirements?.length > 0 && (
              <div>
                <label style={{ marginBottom: 8, display: 'block' }}>Requirements</label>
                <div className="chip-list">
                  {detailJob.requirements.map((r, i) => <span key={i} className="chip">{r}</span>)}
                </div>
              </div>
            )}
            {detailJob.deadline && (
              <div style={{ padding: '10px 14px', background: isDeadlinePassed(detailJob.deadline) ? 'var(--red-bg)' : 'var(--green-bg)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.875rem', color: isDeadlinePassed(detailJob.deadline) ? 'var(--red)' : 'var(--green)' }}>
                  {isDeadlinePassed(detailJob.deadline) ? '⛔ Deadline passed: ' : '✅ Deadline: '}
                  {new Date(detailJob.deadline).toLocaleDateString()}
                </span>
              </div>
            )}
            {role === 'Applicant' && !appliedJobs[detailJob._id] && !isDeadlinePassed(detailJob.deadline) && (
              <button className="btn" onClick={() => { setDetailJob(null); setApplyingTo(detailJob); }}>Apply for this role →</button>
            )}
          </div>
        </Modal>
      )}

      {/* Apply Modal */}
      {applyingTo && (
        <Modal title={`Apply — ${applyingTo.title}`} onClose={() => { setApplyingTo(null); setCoverLetter(''); }}>
          <div className="stack">
            <div style={{ padding: '12px 14px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
              <strong style={{ color: 'var(--ink)' }}>{applyingTo.company}</strong>
              <span style={{ color: 'var(--ink3)' }}> · {applyingTo.jobType} · {applyingTo.location}</span>
            </div>
            <div className="form-group">
              <label>Resume <span style={{ color: 'var(--red)' }}>*</span></label>
              <input type="file" accept=".pdf,.doc,.docx" onChange={e => setResumeFiles(p => ({ ...p, [applyingTo._id]: e.target.files?.[0] }))} required />
              <span style={{ fontSize: '0.75rem', color: 'var(--ink3)' }}>PDF, DOC or DOCX — max 5MB</span>
            </div>
            <div className="form-group">
              <label>Cover Letter (optional)</label>
              <textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)} placeholder="Tell us why you're a great fit..." />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => { setApplyingTo(null); setCoverLetter(''); }}>Cancel</button>
              <button className="btn" onClick={() => applyJob(applyingTo)}>Submit Application →</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
