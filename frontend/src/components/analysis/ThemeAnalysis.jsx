export default function ThemeAnalysis({ data }) {
  return (
    <div className="card stage-card">
      <div className="card-header">
        <h3>Theme Detection</h3>
      </div>
      <div className="theme-primary">
        <span className="section-label">Primary Theme</span>
        <div className="theme-primary-value">🔥 {data.primary}</div>
        <span className="theme-similarity">{data.similarity}% similarity</span>
      </div>
      <div className="theme-secondary">
        <span className="section-label">Secondary Themes</span>
        <div className="chip-row">
          {data.secondary.map((t) => <span key={t} className="chip static">{t}</span>)}
        </div>
      </div>
      <p className="stage-note">Semantic similarity identifies feedback related to recurring organizational themes.</p>
      <p className="stage-model">Model: {data.model}</p>
    </div>
  )
}
