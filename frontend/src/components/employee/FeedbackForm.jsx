import { useState } from 'react'
import { Lock } from 'lucide-react'
import VoiceRecorder from './VoiceRecorder'
import { CATEGORIES, DEPARTMENTS } from '../../data/mockData'

export default function FeedbackForm({ anonymousMode, onSubmit }) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState('General')
  const [department, setDepartment] = useState('')
  const [anonymous, setAnonymous] = useState(anonymousMode)
  const [employeeName, setEmployeeName] = useState('')
  const [source, setSource] = useState('text')

  const charCount = text.length

  const handleTranscriptChange = (updater) => {
    setSource('voice')
    setText((prev) => (typeof updater === 'function' ? updater(prev) : updater))
  }

  const submit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    if (!anonymous && !employeeName.trim()) {
      alert('Enter your name, or switch on anonymous submission.')
      return
    }
    onSubmit({
      text: text.trim(),
      source,
      category,
      department: department || null,
      anonymous,
      employee_name: anonymous ? null : employeeName.trim(),
    })
  }

  return (
    <form className="feedback-card" onSubmit={submit}>
      <div className="feedback-card-heading">
        <h2>Share your feedback</h2>
        <p>Tell us what's on your mind.</p>
      </div>

      <textarea
        className="feedback-textarea"
        placeholder="Tell us about your experience..."
        value={text}
        onChange={(e) => { setSource('text'); setText(e.target.value) }}
        rows={5}
      />
      <div className="char-count">{charCount} characters</div>

      <div className="category-section">
        <label className="section-label">Category</label>
        <div className="chip-row">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c}
              className={'chip' + (category === c ? ' selected' : '')}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="voice-section">
        <label className="section-label">Voice Feedback</label>
        <VoiceRecorder transcript={text} onTranscriptChange={handleTranscriptChange} />
      </div>

      <div className="privacy-section">
        <div className="privacy-header">
          <div>
            <label className="section-label">Anonymous Feedback</label>
            <p className="privacy-desc">Your identity will not be shown to HR.</p>
          </div>
          <button
            type="button"
            className={'toggle-switch' + (anonymous ? ' on' : '')}
            onClick={() => setAnonymous(!anonymous)}
            aria-pressed={anonymous}
            aria-label="Submit anonymously"
          >
            <span className="toggle-knob" />
          </button>
        </div>

        {anonymous ? (
          <div className="privacy-locked">
            <Lock size={15} /> Your identity will remain private
          </div>
        ) : (
          <div className="privacy-fields">
            <input
              type="text"
              placeholder="Employee name"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
            />
            <select value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}
      </div>

      <button type="submit" className="btn-primary btn-block">Submit Feedback</button>
    </form>
  )
}
