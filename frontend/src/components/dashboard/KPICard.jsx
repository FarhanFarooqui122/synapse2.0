export default function KPICard({ icon: Icon, label, value, trend, trendTone = 'neutral', accent }) {
  const gradientStyle = accent ? {
    background: `linear-gradient(135deg, ${accent.bg} 0%, ${accent.fg}22 100%)`,
    borderColor: accent.fg
  } : undefined;

  return (
    <div className="kpi-card" style={gradientStyle}>
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
