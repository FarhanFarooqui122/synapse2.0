export default function EmotionAnalysis({ data }) {
  const max = Math.max(...data.map((d) => d.value))
  return (
    <div className="card stage-card">
      <div className="card-header">
        <h3>Detected Emotions</h3>
      </div>
      <div className="emotion-bars">
        {data.map((e) => (
          <div className="emotion-row" key={e.name}>
            <span className="emotion-label">{e.name}</span>
            <div className="emotion-track">
              <div className="emotion-fill" style={{ width: `${(e.value / max) * 100}%`, background: e.color }} />
            </div>
            <span className="emotion-value">{e.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
