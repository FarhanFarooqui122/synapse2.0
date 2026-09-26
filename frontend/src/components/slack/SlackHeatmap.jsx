import React from 'react'

const CATEGORY_COLORS = {
  'workplace-conduct': '#DC2626',
  'burnout': '#EA580C',
  'workload': '#D97706',
  'facilities': '#64748B',
  'milestone': '#16A34A',
  'hr-concern': '#7C3AED',
  general: '#94A3B8',
}

const PRIORITY_COLORS = { P1: '#DC2626', P2: '#EA580C', P3: '#D97706', P4: '#16A34A' }

export default function SlackHeatmap({ heatmapData }) {
  if (!heatmapData || heatmapData.length === 0) {
    return <p className="empty-state">No Slack feedback data yet. Run the simulation to generate it.</p>
  }

  const maxUrgency = Math.max(...heatmapData.map(d => d.urgency))

  return (
    <div className="slack-heatmap">
      <h3>Slack Feedback Heatmap</h3>
      <div className="heatmap-table">
        <div className="heatmap-header">
          <span>Team</span>
          <span>Urgency</span>
          <span>Messages</span>
          <span>Negative</span>
          <span>Positive</span>
          <span>Neutral</span>
          <span>Category</span>
        </div>
        {heatmapData.map((row, i) => (
          <div key={i} className="heatmap-row">
            <span className="heatmap-team">{row.team}</span>
            <span>
              <div
                className="heatmap-bar"
                style={{
                  width: `${(row.urgency / maxUrgency) * 100}%`,
                  backgroundColor: row.urgency >= 3 ? '#DC2626' : row.urgency >= 2 ? '#D97706' : '#16A34A',
                }}
              />
              <span className="heatmap-value">{row.urgency.toFixed(1)}</span>
            </span>
            <span>{row.message_count}</span>
            <span>{row.sentiment_negative}</span>
            <span>{row.sentiment_positive}</span>
            <span>{row.sentiment_neutral}</span>
            <span>
              <span className="category-badge" style={{ backgroundColor: CATEGORY_COLORS[row.category] || '#94A3B8' }}>
                {row.category}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
