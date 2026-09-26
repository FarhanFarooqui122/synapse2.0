import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'

const CATEGORY_COLORS = {
  'workplace-conduct': '#DC2626',
  'burnout': '#EA580C',
  'workload': '#D97706',
  'facilities': '#64748B',
  'milestone': '#16A34A',
  'hr-concern': '#7C3AED',
  general: '#94A3B8',
}

const URGENCY_COLORS = ['#16A34A', '#D97706', '#EA580C', '#DC2626']

export default function SlackHeatmap({ heatmapData }) {
  if (!heatmapData || heatmapData.length === 0) {
    return <p className="empty-state">No Slack feedback data yet. Run the simulation to generate it.</p>
  }

  return (
    <div className="slack-heatmap">
      <h3>Slack Feedback Heatmap</h3>
      <div className="chart-container">
        <h4>Avg Urgency by Team</h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={heatmapData} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 4]} tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="team" tick={{ fontSize: 12 }} width={110} />
            <Tooltip />
            <Bar dataKey="urgency" radius={[0, 4, 4, 0]}>
              {heatmapData.map((entry, index) => (
                <Cell key={index} fill={URGENCY_COLORS[entry.urgency >= 3 ? 3 : entry.urgency >= 2 ? 2 : entry.urgency >= 1 ? 1 : 0]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <h4>Message Count by Team & Category</h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={heatmapData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="team" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="message_count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="heatmap-details">
        {heatmapData.map((row, i) => (
          <div key={i} className="heatmap-detail-row">
            <span className="detail-team">{row.team}</span>
            <div className="detail-bars">
              <span className="detail-label">Neg:</span>
              <span className="detail-bar" style={{ width: `${(row.sentiment_negative / Math.max(row.sentiment_negative, row.sentiment_positive, row.sentiment_neutral, 1)) * 100}%`, backgroundColor: '#DC2626' }} />
              <span className="detail-val">{row.sentiment_negative}</span>
              <span className="detail-label" style={{ marginLeft: 8 }}>Pos:</span>
              <span className="detail-bar" style={{ width: `${(row.sentiment_positive / Math.max(row.sentiment_negative, row.sentiment_positive, row.sentiment_neutral, 1)) * 100}%`, backgroundColor: '#16A34A' }} />
              <span className="detail-val">{row.sentiment_positive}</span>
              <span className="detail-label" style={{ marginLeft: 8 }}>Neu:</span>
              <span className="detail-bar" style={{ width: `${(row.sentiment_neutral / Math.max(row.sentiment_negative, row.sentiment_positive, row.sentiment_neutral, 1)) * 100}%`, backgroundColor: '#D97706' }} />
              <span className="detail-val">{row.sentiment_neutral}</span>
              <span className="detail-label" style={{ marginLeft: 8 }}>Priority:</span>
              <span className="category-badge" style={{ backgroundColor: CATEGORY_COLORS[row.category] || '#94A3B8' }}>{row.category}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
