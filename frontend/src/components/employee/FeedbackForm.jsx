import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import VoiceRecorder from './VoiceRecorder'
import { CATEGORIES, DEPARTMENTS } from '../../data/mockData'

export default function FeedbackForm({ anonymousMode, submitting = false, serverError = '', onSubmit }) {
  const [text, setText] = useState('')
  const [feedbackType, setFeedbackType] = useState('feedback') // feedback | complaint
  const [category, setCategory] = useState('General')
  const [department, setDepartment] = useState('')
  const [anonymous, setAnonymous] = useState(anonymousMode)
  const [employeeName, setEmployeeName] = useState('')
  const [source, setSource] = useState('text')

  // Keep the in-form toggle in sync with the header toggle.
  useEffect(() => { setAnonymous(anonymousMode) }, [anonymousMode])

  const charCount = text.length
  const isComplaint = feedbackType === 'complaint'

  const handleTranscriptChange = (updater) => {
    setSource('voice')
    setText((prev) => (typeof updater === 'function' ? updater(prev) : updater))
  }

  const submit = (e) => {
    e.preventDefault()
    if (submitting) return
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
      feedback_type: feedbackType,
    })
  }

  return (
    <form className="feedback-card" onSubmit={submit}>
      <div className="feedback-card-heading">
        <h2>Share your feedback</h2>
        <p>Tell us what&apos;s on your mind.</p>
      </div>

      <div className="category-section" style={{ borderTop: 'none', paddingTop: 0 }}>
        <label className="section-label">Feedback type</label>
        <div className="chip-row">
          <button
            type="button"
            className={'chip' + (!isComplaint ? ' selected' : '')}
            onClick={() => setFeedbackType('feedback')}
          >
            💬 General Feedback
          </button>
          <button
            type="button"
            className={'chip' + (isComplaint ? ' selected' : '')}
            onClick={() => setFeedbackType('complaint')}
          >
            ⚠️ Complaint
          </button>
        </div>
        {isComplaint && (
          <p className="privacy-desc" style={{ marginTop: 8 }}>
            A complaint is something you want HR to investigate and address.
            You&apos;ll be able to track its status afterwards.
          </p>
        )}
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
            <label className="section-label">🔒 Submit anonymously</label>
            <p className="privacy-desc">
              {isComplaint
                ? 'Your name will not be shared with HR for this complaint. You’ll get a tracking ID to check its status.'
                : 'Your identity will not be shown to HR.'}
            </p>
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
          <>
            <div className="privacy-fields">
              <input
                type="text"
                placeholder="Employee name"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
              />
            </div>
            <p className="privacy-desc" style={{ marginTop: 8 }}>
              Your name and department will be visible to HR.
            </p>
          </>
        )}

        <div className="privacy-fields" style={{ marginTop: anonymous ? 12 : 10 }}>
          <select value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">Select department (optional)</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {serverError && <p className="form-error">{serverError}</p>}

      <button type="submit" className="btn-primary btn-block" disabled={submitting}>
        {submitting ? 'Submitting…' : isComplaint ? 'Submit Complaint' : 'Submit Feedback'}
      </button>
    </form>
  )
}
