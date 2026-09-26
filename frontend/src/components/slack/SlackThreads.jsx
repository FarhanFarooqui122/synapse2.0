import React from 'react'

const NEGATIVE_COLOR = '#DC2626'
const POSITIVE_COLOR = '#16A34A'

function highlightText(text, highlights) {
  if (!highlights || highlights.length === 0) return text
  const parts = []
  let lastIndex = 0
  const sorted = [...highlights].sort((a, b) => a.start - b.start)
  for (const h of sorted) {
    if (h.start > lastIndex) {
      parts.push(<span key={`t-${lastIndex}`}>{text.slice(lastIndex, h.start)}</span>)
    }
    parts.push(
      <mark key={`h-${h.start}`} style={{ backgroundColor: `${NEGATIVE_COLOR}33`, color: NEGATIVE_COLOR, fontWeight: 600, borderRadius: 2, padding: '1px 2px' }}>
        {text.slice(h.start, h.end)}
      </mark>
    )
    lastIndex = h.end
  }
  if (lastIndex < text.length) {
    parts.push(<span key={`t-${lastIndex}`}>{text.slice(lastIndex)}</span>)
  }
  return parts
}

const SENTIMENT_ICONS = { negative: '🔴', neutral: '🟡', positive: '🟢', critical: '🔴' }

export default function SlackThreads({ conversations }) {
  if (!conversations || conversations.length === 0) {
    return <p className="empty-state">No Slack conversation data yet. Run the simulation to generate it.</p>
  }

  return (
    <div className="slack-threads">
      {conversations.map((conv, i) => (
        <div key={i} className={`thread-card ${conv.sentiment === 'negative' ? 'thread-negative' : 'thread-positive'}`}>
          <div className="thread-header">
            <div className="thread-title">
              <span className="thread-icon">{SENTIMENT_ICONS[conv.sentiment] || '🟢'}</span>
              <span className="thread-name">
                {conv.type === 'dm' ? '💬 DM' : '👥 Group'} — {conv.team}
              </span>
              <span className="thread-badge">
                {conv.sentiment === 'negative' || conv.sentiment === 'critical' ? '⚠️ Negative' : '✅ Positive'}
              </span>
            </div>
          </div>

          <div className="thread-messages">
            {conv.messages.map((msg, j) => (
              <div key={j} className={`message-bubble sentiment-${msg.sentiment}`}>
                <div className="message-meta">
                  <span className="message-user">{msg.user}</span>
                  <span className="message-time">{new Date(msg.timestamp).toLocaleString()}</span>
                  <span className="message-sentiment">{SENTIMENT_ICONS[msg.sentiment] || '🟡'} {msg.sentiment}</span>
                </div>
                <div className="message-text">{highlightText(msg.text, msg.highlights)}</div>
              </div>
            ))}
          </div>

          <div className="thread-summary">
            <h4>📋 Summary</h4>
            <p>{conv.summary}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
