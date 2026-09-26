import { ArrowRight } from 'lucide-react'

const DOT = { High: '🔴', Medium: '🟠', Low: '🟢' }

export default function PriorityIssueCard({ issue, onView }) {
  return (
    <div className="priority-card">
      <div className="priority-card-top">
        <h4>{DOT[issue.priority] || ''} {issue.title}</h4>
        <span className={`priority-badge ${(issue.priority || '').toLowerCase()}`}>{issue.priority} Priority</span>
      </div>
      {(issue.mentions != null || issue.negativeSentiment != null) && (
        <div className="priority-card-stats">
          {issue.mentions != null && <span><strong>{issue.mentions}</strong> mentions</span>}
          {issue.trend && <span className="stat-trend">↑ {String(issue.trend).replace('+', '')}</span>}
          {issue.negativeSentiment != null && <span>{issue.negativeSentiment}% negative sentiment</span>}
        </div>
      )}
      {issue.description && (
        <p style={{ fontSize: '0.85rem', color: '#667085', marginBottom: 12 }}>{issue.description}</p>
      )}
      {onView && (
        <button className="text-link" onClick={onView}>
          View Analysis <ArrowRight size={15} />
        </button>
      )}
    </div>
  )
}
