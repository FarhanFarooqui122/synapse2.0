import { ArrowRight } from 'lucide-react'

const DOT = { High: '🔴', Medium: '🟠', Low: '🟢' }

export default function PriorityIssueCard({ issue, onView }) {
  return (
    <div className="priority-card">
      <div className="priority-card-top">
        <h4>{DOT[issue.priority]} {issue.title}</h4>
        <span className={`priority-badge ${issue.priority.toLowerCase()}`}>{issue.priority} Priority</span>
      </div>
      <div className="priority-card-stats">
        <span><strong>{issue.mentions}</strong> mentions</span>
        <span className="stat-trend">↑ {issue.trend.replace('+', '')}</span>
        <span>{issue.negativeSentiment}% negative sentiment</span>
      </div>
      <button className="text-link" onClick={onView}>
        View Analysis <ArrowRight size={15} />
      </button>
    </div>
  )
}
