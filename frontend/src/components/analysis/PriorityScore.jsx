import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const PRIORITY_COLORS = {
  'HIGH PRIORITY': '#DC2626',
  'MEDIUM PRIORITY': '#D97706',
  'LOW PRIORITY': '#16A34A',
}

export default function PriorityScore({ data }) {
  const color = PRIORITY_COLORS[data.label] || '#667085'
  
  const factorScores = data.factors.map((factor, index) => {
    const baseScore = Math.round((data.score / data.factors.length) * (index + 1))
    return { factor: factor.slice(0, 20), score: baseScore, fullFactor: factor, color }
  })

  return (
    <div className="card stage-card priority-score-card">
      <div className="card-header"><h3>Explainable Priority Score</h3></div>
      <div className="priority-score-display">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={factorScores} layout="vertical" margin={{ top: 5, right: 5, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7EC" />
            <XAxis type="number" domain={[0, data.score + 10]} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#667085' }} />
            <YAxis type="category" dataKey="factor" width={120} tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 500, fill: '#1D2939' }} />
            <Tooltip 
              contentStyle={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              formatter={(value) => [`${value}`, 'Score']}
              labelFormatter={(label) => {
                const item = factorScores.find(d => d.factor === label)
                return item ? item.fullFactor : label
              }}
            />
            <Bar dataKey="score" radius={[0, 4, 4, 0]} maxBarSize={24}>
              {factorScores.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="priority-score-center">
          <span className="priority-score-number" style={{ color }}>{data.score}</span>
          <span className="priority-score-max">/ 100</span>
        </div>
      </div>
      <span className="priority-score-badge" style={{ background: color + '20', color }}>🔴 {data.label}</span>
      <div className="priority-factors">
        <span className="section-label">Contributing Factors</span>
        <ul>
          {data.factors.map((f) => <li key={f}>{f}</li>)}
        </ul>
      </div>
    </div>
  )
}