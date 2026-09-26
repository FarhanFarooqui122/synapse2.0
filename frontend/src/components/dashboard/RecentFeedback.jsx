const SENTIMENT_DOT = { positive: '🟢', neutral: '⚪', negative: '🔴' }

function cap(s) {
  if (!s) return '—'
  return s[0].toUpperCase() + s.slice(1)
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return iso
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function who(f) {
  if (f.anonymous) return 'Anonymous Employee'
  return f.employee_name || 'Employee'
}

export default function RecentFeedback({ items }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3>Recent Feedback</h3>
      </div>
      <div className="feedback-table">
        <div className="feedback-table-head">
          <span>Feedback</span>
          <span>Sentiment</span>
          <span>Theme</span>
          <span>Priority</span>
          <span>Date</span>
        </div>
        {items.map((f) => {
          const isComplaint = (f.feedback_type || 'feedback') === 'complaint'
          return (
            <div className="feedback-table-row" key={f.id}>
              <span className="ft-text">
                <span className={`type-badge ${isComplaint ? 'complaint' : 'feedback'}`}>
                  {isComplaint ? '⚠ Complaint' : 'Feedback'}
                </span>{' '}
                {f.text}
                <br />
                <small style={{ color: '#98A2B3' }}>
                  {[who(f), f.category, f.department]
                    .filter(Boolean)
                    .join(' · ')}
                  {f.source === 'voice' ? ' · 🎙️ voice' : ''}
                  {isComplaint ? ` · ${cap(f.status || 'open')}` : ''}
                </small>
              </span>
              <span>
                {f.sentiment
                  ? `${SENTIMENT_DOT[f.sentiment] || ''} ${cap(f.sentiment)}`
                  : <span className="pending">Pending analysis</span>}
              </span>
              <span>{f.theme || f.category || <span className="pending">Pending analysis</span>}</span>
              <span>
                {f.priority
                  ? <span className={`priority-pill ${f.priority.toLowerCase()}`}>{cap(f.priority)}</span>
                  : <span className="pending">Pending analysis</span>}
              </span>
              <span className="ft-date">{formatDate(f.created_at)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
