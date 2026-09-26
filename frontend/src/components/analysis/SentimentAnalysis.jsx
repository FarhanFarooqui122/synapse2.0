export default function SentimentAnalysis({ data }) {
  return (
    <div className="card stage-card">
      <div className="card-header">
        <h3>Sentiment Analysis</h3>
      </div>
      <div className="sentiment-result">
        <span className="sentiment-dot">🔴</span>
        <span className="sentiment-label">{data.label}</span>
        <span className="sentiment-confidence">{data.confidence}% confidence</span>
      </div>
      <div className="sentiment-breakdown">
        {Object.entries(data.breakdown).map(([key, val]) => (
          <div className="breakdown-row" key={key}>
            <span className="breakdown-label">{key[0].toUpperCase() + key.slice(1)}</span>
            <div className="breakdown-track">
              <div className={`breakdown-fill ${key}`} style={{ width: `${val}%` }} />
            </div>
            <span className="breakdown-value">{val}%</span>
          </div>
        ))}
      </div>
      <p className="stage-note">Transformer-based sentiment classification.</p>
      <p className="stage-model">Model: {data.model}</p>
    </div>
  )
}
