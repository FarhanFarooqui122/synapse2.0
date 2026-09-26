import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function SentimentTrend({ data }) {
  const hasSignal =
    Array.isArray(data) &&
    data.some((p) => (p.Positive || 0) + (p.Neutral || 0) + (p.Negative || 0) > 0)

  return (
    <div className="card trend-card">
      <div className="card-header">
        <h3>Employee Sentiment Trend</h3>
      </div>
      {!hasSignal ? (
        <div className="state-card" style={{ padding: '28px 16px' }}>
          <h3>Not enough history yet</h3>
          <p>Sentiment trend will appear once feedback with AI analysis spans multiple days.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#667085' }} axisLine={{ stroke: '#E4E7EC' }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E4E7EC', fontSize: 13 }} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Line type="monotone" dataKey="Positive" stroke="#16A34A" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Neutral" stroke="#94A3B8" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Negative" stroke="#DC2626" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
