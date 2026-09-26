import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function EmotionAnalysis({ data }) {
  const chartData = data.map((e, i) => ({
    name: e.name,
    value: e.value,
    color: e.color,
  }))

  return (
    <div className="card stage-card">
      <div className="card-header"><h3>Detected Emotions</h3></div>
      <div className="emotion-chart">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 5, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7EC" />
            <XAxis type="number" domain={[0, 'dataMax + 10']} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#667085' }} />
            <YAxis type="category" dataKey="name" width={100} tickLine={false} axisLine={false} tick={{ fontSize: 12, fontWeight: 500, fill: '#1D2939' }} />
            <Tooltip 
              contentStyle={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              formatter={(value) => [`${value}%`, '']}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="emotion-legend">
        {chartData.map((entry) => (
          <div key={entry.name} className="legend-item">
            <span className="legend-color" style={{ background: entry.color }} />
            <span className="legend-label">{entry.name}</span>
            <span className="legend-value">{entry.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}