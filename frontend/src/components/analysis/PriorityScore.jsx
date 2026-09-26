import { RadialBarChart, RadialBar, Cell } from 'recharts'

const PRIORITY_COLORS = {
  'HIGH PRIORITY': '#DC2626',
  'MEDIUM PRIORITY': '#D97706',
  'LOW PRIORITY': '#16A34A',
}

export default function PriorityScore({ data }) {
  const color = PRIORITY_COLORS[data.label] || '#667085'
  const chartData = [{ name: 'Priority', value: data.score }]

  return (
    <div className="card stage-card priority-score-card">
      <div className="card-header">
        <h3>Explainable Priority Score</h3>
      </div>
      <div className="priority-score-display">
        <RadialBarChart width={160} height={160} cx="50%" cy="50%" innerRadius={55} outerRadius={70} data={chartData}>
          <RadialBar
            dataKey="value"
            background={{ fill: '#E4E7EC' }}
            radius={70}
            innerRadius={55}
            minAngle={0}
            maxAngle={360}
            roundCap={true}
          >
            <Cell fill={color} />
          </RadialBar>
        </RadialBarChart>
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