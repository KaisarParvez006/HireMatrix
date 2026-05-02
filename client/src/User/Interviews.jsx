import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../state';
import { useToast } from '../Components/Toast';
import StatusBadge from '../Components/StatusBadge';

export default function Interviews() {
  const { user } = useAuth();
  const toast = useToast();
  const role = user?.role;
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [result, setResult] = useState('Pass');

  const load = async () => {
    try {
      const { data } = await api.get('/interviews');
      setInterviews(data);
    } catch { toast.error('Failed to load interviews'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submitFeedback = async () => {
    try {
      await api.patch(`/interviews/${feedbackModal._id}`, { feedback, result });
      toast.success('Feedback submitted');
      setFeedbackModal(null);
      setFeedback('');
      load();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to submit feedback'); }
  };

  if (loading) return <div className="loading-screen"><span className="spinner" /> Loading interviews...</div>;

  const upcoming = interviews.filter(i => new Date(i.scheduledDate) >= new Date());
  const past = interviews.filter(i => new Date(i.scheduledDate) < new Date());

  const renderInterview = (interview) => {
    const job = interview.applicationId?.jobId;
    const applicant = interview.applicationId?.applicantId;
    const isPast = new Date(interview.scheduledDate) < new Date();

    return (
      <div key={interview._id} className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--radius)',
              background: interview.result === 'Pass' ? 'var(--green-bg)' : interview.result === 'Fail' ? 'var(--red-bg)' : 'rgba(124,92,252,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', flexShrink: 0,
            }}>
              {interview.interviewType === 'Technical' ? '💻' : interview.interviewType === 'HR' ? '🤝' : interview.interviewType === 'Final' ? '🏆' : '🎯'}
            </div>
            <div>
              <h4 style={{ color: 'var(--ink)', marginBottom: 3 }}>{job?.title || 'Interview'}</h4>
              <p style={{ fontSize: '0.8rem', marginBottom: 6 }}>
                {role === 'Applicant' ? job?.company : `Candidate: ${applicant?.name || '—'}`}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge badge-purple">{interview.interviewType}</span>
                <span className="badge badge-gray">
                  📅 {new Date(interview.scheduledDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
                {interview.interviewerName && <span className="badge badge-gray">👤 {interview.interviewerName}</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <StatusBadge status={interview.result === 'Pending' ? 'Under Review' : interview.result === 'Pass' ? 'Selected' : 'Rejected'} />
            <span style={{ fontSize: '0.75rem', color: isPast ? 'var(--ink3)' : 'var(--green)', fontWeight: 600 }}>
              {isPast ? 'Completed' : '● Upcoming'}
            </span>
          </div>
        </div>

        {interview.meetLink && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <a href={interview.meetLink} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
              🔗 Join Meeting
            </a>
          </div>
        )}

        {interview.feedback && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', borderTop: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--ink3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-display)' }}>Feedback</span>
            <p style={{ marginTop: 4, color: 'var(--ink2)' }}>{interview.feedback}</p>
          </div>
        )}

        {['Recruiter', 'HR', 'HiringManager', 'Admin'].includes(role) && interview.result === 'Pending' && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-sm" onClick={() => { setFeedbackModal(interview); setFeedback(''); setResult('Pass'); }}>
              Add Feedback & Result
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Interviews</h2>
        <p>{role === 'Applicant' ? 'Your scheduled interviews' : 'Manage and track interviews'}</p>
      </div>

      {interviews.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h4>No interviews yet</h4>
          <p>Interviews will appear here once scheduled.</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="mb-6">
              <h4 style={{ marginBottom: 14, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>●</span> Upcoming ({upcoming.length})
              </h4>
              {upcoming.map(renderInterview)}
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h4 style={{ marginBottom: 14, color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>◉</span> Past ({past.length})
              </h4>
              {past.map(renderInterview)}
            </div>
          )}
        </>
      )}

      {feedbackModal && (
        <div className="modal-overlay" onClick={() => setFeedbackModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Submit Feedback</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setFeedbackModal(null)}>✕</button>
            </div>
            <div className="stack">
              <div style={{ padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
                <strong style={{ color: 'var(--ink)' }}>{feedbackModal.applicationId?.applicantId?.name}</strong>
                {' — '}{feedbackModal.applicationId?.jobId?.title}
              </div>
              <div className="form-group">
                <label>Result</label>
                <select value={result} onChange={e => setResult(e.target.value)}>
                  <option value="Pass">Pass ✓</option>
                  <option value="Fail">Fail ✕</option>
                </select>
              </div>
              <div className="form-group">
                <label>Feedback Notes</label>
                <textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Technical skills, communication, culture fit..." style={{ minHeight: 120 }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setFeedbackModal(null)}>Cancel</button>
                <button className={`btn ${result === 'Pass' ? 'btn-success' : 'btn-danger'}`} onClick={submitFeedback}>
                  Submit {result}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
