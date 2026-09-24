import { useState } from 'react'
import { api } from '../api'

const TASKS = [
  { value: 'general', label: 'General Q&A' },
  { value: 'categorize', label: 'Categorize transaction' },
  { value: 'fraud_check', label: 'Fraud risk check' },
  { value: 'risk_score', label: 'Credit/loan risk score' },
]

export default function AIPanel() {
  const [input, setInput] = useState('')
  const [task, setTask] = useState('general')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const run = async () => {
    if (!input) return
    setLoading(true)
    setResult('')
    try {
      const res = await api.analyze(input, task)
      setResult(res.data.result)
    } catch (err) {
      setResult('Error: ' + (err.response?.data?.detail || err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ai-panel">
      <h3>AI Assistant</h3>
      <select value={task} onChange={(e) => setTask(e.target.value)}>
        {TASKS.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
      <textarea
        placeholder="Paste a transaction, applicant description, or question..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={3}
      />
      <button onClick={run} disabled={loading}>
        {loading ? 'Thinking...' : 'Run'}
      </button>
      {result && <div className="ai-result">{result}</div>}
    </div>
  )
}
