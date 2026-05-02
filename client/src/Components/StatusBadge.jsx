const STATUS_STYLES = {
  Applied:              'badge-gray',
  'Under Review':       'badge-blue',
  Shortlisted:          'badge-cyan',
  'Interview Scheduled':'badge-purple',
  Selected:             'badge-green',
  Rejected:             'badge-red',
  'Not Shortlisted':    'badge-yellow',
  Approved:             'badge-green',
  Pending:              'badge-yellow',
  Pass:                 'badge-green',
  Fail:                 'badge-red',
  Pending_result:       'badge-gray',
};

export default function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || 'badge-gray';
  return <span className={`badge ${cls}`}>{status}</span>;
}
