import { MOCK_TOP_CONCERNS } from '../../data/mockData'

export default function TopConcerns() {
  const max = Math.max(...MOCK_TOP_CONCERNS.map((c) => c.percent))

  return (
    <div className="card">
      <div className="card-header">
        <h3>Top Employee Concerns</h3>
      </div>
      <div className="concern-list">
        {MOCK_TOP_CONCERNS.map((c) => (
          <button key={c.theme} className="concern-row">
            <div className="concern-row-top">
              <span className="concern-theme">{c.theme}</span>
              <span className="concern-percent">{c.percent}%</span>
            </div>
            <div className="concern-bar-track">
              <div className="concern-bar-fill" style={{ width: `${(c.percent / max) * 100}%` }} />
            </div>
            <span className={'concern-trend' + (c.trend.startsWith('-') ? ' down' : ' up')}>
              {c.trend}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
