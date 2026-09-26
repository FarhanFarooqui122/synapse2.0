const TONE_CLASS = { negative: 'tone-negative', medium: 'tone-medium', positive: 'tone-positive' }

export default function AIInsightCard({ title, body, badge, tone }) {
  return (
    <div className={`insight-card ${TONE_CLASS[tone] || ''}`}>
      <div className="insight-card-top">
        <h4>{title}</h4>
        <span className={`badge ${TONE_CLASS[tone] || ''}`}>{badge}</span>
      </div>
      <p>{body}</p>
    </div>
  )
}
