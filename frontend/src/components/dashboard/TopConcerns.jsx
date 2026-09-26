export default function TopConcerns({ items = [] }) {
  const max = items.length ? Math.max(...items.map((c) => c.percent)) : 1

  return (
    <div className="card">
      <div className="card-header">
        <h3>Top Employee Concerns</h3>
      </div>
      {!items.length ? (
        <div className="state-card" style={{ padding: '28px 16px' }}>
          <h3>No themes detected yet</h3>
          <p>Run Generate AI Insights once feedback has been analyzed.</p>
        </div>
      ) : (
        <div className="concern-list">
          {items.map((c) => (
            <button key={c.theme} className="concern-row">
              <div className="concern-row-top">
                <span className="concern-theme">{c.theme}</span>
                <span className="concern-percent">
                  {c.count != null ? `${c.count} mentions · ` : ''}{c.percent}%
                </span>
              </div>
              <div className="concern-bar-track">
                <div className="concern-bar-fill" style={{ width: `${(c.percent / max) * 100}%` }} />
              </div>
              {c.trend && (
                <span className={'concern-trend' + (c.trend.startsWith('-') ? ' down' : ' up')}>
                  {c.trend}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
