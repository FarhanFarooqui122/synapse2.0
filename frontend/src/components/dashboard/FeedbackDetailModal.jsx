import { useState } from 'react'
import { X } from 'lucide-react'
import { api } from '../../api'

const SENTIMENT_DOT = { positive: '🟢', neutral: '⚪', negative: '🔴' }
const STATUSES = ['open', 'investigating', 'resolved']

function cap(s) {
  if (!s) return '—'
  return s[0].toUpperCase() + s.slice(1)
}

function who(f) {
  if (f.anonymous) return 'Anonymous Employee'
  return f.employee_name || 'Employee'
}

/**
 * Detail view for a single feedback row. Shows only data already computed
 * at submission time (sentiment/theme/emotion/priority) — no new AI call
 * fires on open, so this can't hang or fail live during a demo.
 *
 * "Take action" reuses the existing PATCH /api/feedback/{id}/status
 * endpoint (already built for complaints) — just exposed here for any
 * feedback row, not only complaints.
 */
export default function FeedbackDetailModal({ feedback, onClose, onUpdated }) {
  const [status, setStatus] = useState(feedback.status || 'open')
  const [note, setNote] = useState(feedback.resolution_note || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isComplaint = (feedback.feedback_type || 'feedback') === 'complaint'

  const handleSave = async () => {
    setError('')
    if (status === 'resolved' && !note.trim()) {
      setError('Add a resolution note before marking this resolved.')
      return
    }
    setSaving(true)
    try {
      const res = await api.updateStatus(feedback.id, status, note.trim() || null)
      onUpdated?.(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className={`type-badge ${isComplaint ? 'complaint' : 'feedback'}`}>
            {isComplaint ? '⚠ Complaint' : 'Feedback'}
          </span>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <p className="modal-feedback-text">&ldquo;{feedback.text}&rdquo;</p>

        <div className="modal-meta">
          <span>{who(feedback)}</span>
          {feedback.department && <span>{feedback.department}</span>}
          {feedback.category && <span>{feedback.category}</span>}
          {feedback.source === 'voice' && <span>🎙️ Voice</span>}
        </div>

        <div className="modal-tags-row">
          <div className="modal-tag">
            <span className="modal-tag-label">Sentiment</span>
            <span className="modal-tag-value">
              {feedback.sentiment
                ? `${SENTIMENT_DOT[feedback.sentiment] || ''} ${cap(feedback.sentiment)}`
                : 'Pending analysis'}
            </span>
          </div>
          <div className="modal-tag">
            <span className="modal-tag-label">Theme</span>
            <span className="modal-tag-value">{feedback.theme || feedback.category || '—'}</span>
          </div>
          <div className="modal-tag">
            <span className="modal-tag-label">Priority</span>
            <span className="modal-tag-value">
              {feedback.priority
                ? <span className={`priority-pill ${feedback.priority.toLowerCase()}`}>{cap(feedback.priority)}</span>
                : 'Pending analysis'}
            </span>
          </div>
          {feedback.emotion && (
            <div className="modal-tag">
              <span className="modal-tag-label">Emotion</span>
              <span className="modal-tag-value">{cap(feedback.emotion)}</span>
            </div>
          )}
        </div>

        <div className="modal-action-section">
          <span className="section-label">Take Action</span>

          <div className="modal-status-row">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                className={'status-chip' + (status === s ? ' selected' : '')}
                onClick={() => setStatus(s)}
              >
                {cap(s)}
              </button>
            ))}
          </div>

          <textarea
            placeholder={
              status === 'resolved'
                ? 'Resolution note (required)...'
                : 'Add a note for this update (optional)...'
            }
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />

          {error && <p className="modal-error">{error}</p>}

          <button className="btn-primary btn-block" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Update'}
          </button>
        </div>
      </div>
    </div>
  )
}