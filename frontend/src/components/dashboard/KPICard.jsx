export default function KPICard({ icon: Icon, label, value, trend, trendTone = 'neutral', accent }) {
  return (
    <div className="kpi-card">
      <div className="kpi-icon" style={accent ? { background: accent.bg, color: accent.fg } : undefined}>
        <Icon size={20} />
      </div>
      <div className="kpi-body">
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
      </div>
      {trend && (
        <div className={`kpi-trend ${trendTone}`}>{trend}</div>
      )}
    </div>
  )
}
