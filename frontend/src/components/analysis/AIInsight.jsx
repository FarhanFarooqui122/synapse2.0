import { Sparkles } from 'lucide-react'

export default function AIInsight({ insight, action }) {
  return (
    <>
      <div className="card ai-insight-highlight">
        <div className="card-header">
          <Sparkles size={18} />
          <h3>AI-Generated Insight</h3>
        </div>
        <p className="ai-insight-text">{insight}</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Suggested HR Action</h3>
        </div>
        <p>{action}</p>
        <span className="badge subtle">AI-generated suggestion</span>
      </div>
    </>
  )
}
