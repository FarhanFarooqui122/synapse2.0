import React, { useEffect, useState } from 'react'
import { api } from '../../api'
import SlackThreads from './SlackThreads'

export default function SlackFeedback() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const res = await api.slackConversations()
      setData(res.data)
    } catch {
      setError('Could not load Slack conversations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <p>Loading Slack conversations...</p>
  if (error) return <p>{error}</p>
  if (!data) return null

  const negativeCount = data.conversations?.filter(c => c.has_negative).length || 0
  const totalConversations = data.conversations?.length || 0

  return (
    <div className="slack-feedback">
      <h3>Slack Conversations</h3>
      <p className="subtitle">
        {totalConversations} conversations · {negativeCount} with negative sentiment detected
      </p>
      <SlackThreads conversations={data.conversations || []} />
    </div>
  )
}
