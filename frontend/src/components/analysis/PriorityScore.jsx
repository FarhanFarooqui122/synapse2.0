export default function PriorityScore({ data }) {
  return (
    <div className="card stage-card priority-score-card">
      <div className="card-header">
        <h3>Explainable Priority Score</h3>
      </div>
      <div className="priority-score-display">
        <span className="priority-score-number">{data.score}</span>
        <span className="priority-score-max">/ 100</span>
      </div>
      <span className="priority-score-badge">🔴 {data.label}</span>
      <div className="priority-factors">
        <span className="section-label">Contributing Factors</span>
        <ul>
          {data.factors.map((f) => <li key={f}>{f}</li>)}
        </ul>
      </div>
    </div>
  )
}
