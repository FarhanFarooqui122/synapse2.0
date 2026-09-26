import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = {
  positive: '#16A34A',
  neutral: '#667085',
  negative: '#DC2626',
}

const LABELS = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
}

export default function SentimentAnalysis({ data }) {
  const chartData = Object.entries(data.breakdown).map(([key, value]) => ({
    name: LABELS[key] || key,
    value,
    color: COLORS[key] || '#888',
  }))

  return (
    <div className="card stage-card">
      <div className="card-header">
        <h3>Sentiment Analysis</h3>
      </div>
      <div className="sentiment-result">
        <span className="sentiment-dot" style={{ background: COLORS[data.label.toLowerCase()] }} />
        <span className="sentiment-label">{data.label}</span>
        <span className="sentiment-confidence">{data.confidence}% confidence</span>
      </div>
      <div className="sentiment-chart">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 5, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7EC" />
            <XAxis type="number" domain={[0, 'dataMax + 10']} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#667085' }} />
            <YAxis type="category" dataKey="name" width={80} tickLine={false} axisLine={false} tick={{ fontSize: 12, fontWeight: 500, fill: '#1D2939' }} />
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
      <div className="sentiment-breakdown">
        {chartData.map((entry) => (
          <div className="breakdown-row" key={entry.name}>
            <span className="breakdown-label">{entry.name}</span>
            <span className="breakdown-value" style={{ color: entry.color }}>{entry.value}%</span>
          </div>
        ))}
      </div>
      <p className="stage-note">Transformer-based sentiment classification.</p>
      <p className="stage-model">Model: {data.model}</p>
    </div>
  )
}