import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const THEME_COLORS = [
  '#5B6CDA', '#DC2626', '#16A34A', '#D97706', '#94A3B8', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1', '#14B8A6',
]

export default function ThemeAnalysis({ data }) {
  const themes = [data.primary, ...data.secondary]
  const chartData = themes.map((theme, index) => ({
    name: theme,
    value: index === 0 ? data.similarity : Math.round(data.similarity * (0.9 - index * 0.15)),
    color: THEME_COLORS[index % THEME_COLORS.length],
    isPrimary: index === 0,
  }))

  return (
    <div className="card stage-card">
      <div className="card-header">
        <h3>Theme Detection</h3>
      </div>
      <div className="theme-primary">
        <span className="section-label">Primary Theme</span>
        <div className="theme-primary-value" style={{ background: chartData[0].color }}>
          {data.primary}
        </div>
        <span className="theme-similarity">{data.similarity}% similarity</span>
      </div>
      <div className="theme-chart">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 5, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7EC" />
            <XAxis type="number" domain={[0, 'dataMax + 10']} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#667085' }} />
            <YAxis type="category" dataKey="name" width={120} tickLine={false} axisLine={false} tick={{ fontSize: 12, fontWeight: 500, fill: '#1D2939' }} />
            <Tooltip 
              contentStyle={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              formatter={(value) => [`${value}%`, '']}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.isPrimary ? entry.color : entry.color + '80'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="theme-secondary">
        <span className="section-label">Secondary Themes</span>
        <div className="chip-row">
          {data.secondary.map((t, i) => (
            <span key={t} className="chip static" style={{ background: THEME_COLORS[(i + 1) % THEME_COLORS.length] + '20', borderColor: THEME_COLORS[(i + 1) % THEME_COLORS.length] }}>
              {t}
            </span>
          ))}
        </div>
      </div>
      <p className="stage-note">Semantic similarity identifies feedback related to recurring organizational themes.</p>
      <p className="stage-model">Model: {data.model}</p>
    </div>
  )
}