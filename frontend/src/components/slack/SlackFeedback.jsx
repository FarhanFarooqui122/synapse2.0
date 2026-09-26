import React, { useEffect, useState } from 'react'
import { api } from '../../api'
import SlackHeatmap from './SlackHeatmap'

export default function SlackFeedback() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const res = await api.slackFeedback()
      setData(res.data)
    } catch {
      setError('Could not load Slack feedback')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <p>Loading Slack feedback...</p>
  if (error) return <p>{error}</p>
  if (!data) return null

  return (
    <div className="slack-feedback">
      <h3>Slack Channel Analysis</h3>
      <p className="subtitle">{data.summary?.total_conversations} conversations, {data.summary?.total_messages_analyzed} work-related messages across {data.summary?.teams_with_feedback} teams</p>
      <SlackHeatmap heatmapData={data.heatmap_data || []} />
      <div className="team-feedback-list">
        {data.team_feedback?.map((team, i) => (
          <div key={i} className="team-card">
            <div className="team-header">
              <span className="team-name">{team.team}</span>
              <span className="priority-badge" style={{ backgroundColor: team.priority === 'P1' ? '#DC2626' : team.priority === 'P2' ? '#EA580C' : '#16A34A' }}>
                {team.priority}
              </span>
            </div>
            <div className="team-details">
              <span>Category: {team.category}</span>
              <span>Messages: {team.message_count}</span>
              <span>Avg Urgency: {team.avg_urgency_score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
