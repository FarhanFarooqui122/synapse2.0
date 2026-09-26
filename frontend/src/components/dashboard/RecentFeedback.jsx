const SENTIMENT_DOT = { positive: '🟢', neutral: '⚪', negative: '🔴' }

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
        {items.map((f) => (
          <div className="feedback-table-row" key={f.id}>
            <span className="ft-text">{f.text}</span>
            <span>{SENTIMENT_DOT[f.sentiment]} {f.sentiment[0].toUpperCase() + f.sentiment.slice(1)}</span>
            <span>{f.theme}</span>
            <span className={`priority-pill ${f.priority.toLowerCase()}`}>{f.priority}</span>
            <span className="ft-date">{f.dateLabel}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
