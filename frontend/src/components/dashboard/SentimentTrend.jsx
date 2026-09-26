import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { buildSentimentTrend } from '../../data/mockData'

const RANGES = [
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '3 Months', days: 90 },
]

export default function SentimentTrend() {
  const [rangeIdx, setRangeIdx] = useState(1)
  const data = useMemo(() => buildSentimentTrend(RANGES[rangeIdx].days), [rangeIdx])

  return (
    <div className="card trend-card">
      <div className="card-header">
        <h3>Employee Sentiment Trend</h3>
        <div className="range-controls">
          {RANGES.map((r, i) => (
            <button
              key={r.label}
              className={'range-btn' + (i === rangeIdx ? ' active' : '')}
              onClick={() => setRangeIdx(i)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#667085' }} axisLine={{ stroke: '#E4E7EC' }} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E4E7EC', fontSize: 13 }} />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <Line type="monotone" dataKey="Positive" stroke="#16A34A" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Neutral" stroke="#94A3B8" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Negative" stroke="#DC2626" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
