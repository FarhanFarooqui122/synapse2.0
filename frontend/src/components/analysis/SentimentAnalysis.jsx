export default function SentimentAnalysis({ data }) {
  const COLORS = {
    positive: '#16A34A',
    neutral: '#667085',
    negative: '#DC2626',
  }

  const LABELS = {
    positive: 'Positive',
    neutral: 'Neutral',
    negative: 'Negative',
  }

  const breakdownData = Object.entries(data.breakdown).map(([key, value]) => ({
    name: LABELS[key] || key,
    value,
    color: COLORS[key] || '#888',
  }))

  return (
    <div className="card stage-card">
      <div className="card-header"><h3>Sentiment Analysis</h3></div>
      <div className="sentiment-result">
        <span className="sentiment-dot" style={{ background: COLORS[data.label?.toLowerCase?.() || 'negative'] }} />
        <span className="sentiment-label">{data.label}</span>
        <span className="sentiment-confidence">{data.confidence}% confidence</span>
      </div>
      <div className="sentiment-breakdown">
        {breakdownData.map((entry) => (
          <div className="breakdown-row" key={entry.name}>
            <span className="breakdown-label">{entry.name}</span>
            <span className="breakdown-value" style={{ color: entry.color }}>{entry.value}%</span>
          </div>
        ))}
      </div>
      <p className="stage-note">Transformer-based sentiment classification.</p>
      <p className="stage-model">Model: {data.model}</p>
    </div>
  )
}