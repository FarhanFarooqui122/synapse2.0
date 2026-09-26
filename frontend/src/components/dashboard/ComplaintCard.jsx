import { useState } from 'react'
import { api } from '../../api'

const STATUS_LABEL = { open: 'Open', investigating: 'Investigating', resolved: 'Resolved' }

function ageOf(iso) {
  if (!iso) return ''
  const d = new Date(String(iso).replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return ''
  const days = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

function cap(s) {
  if (!s) return ''
  return s[0].toUpperCase() + s.slice(1)
}

export default function ComplaintCard({ complaint, onSaved }) {
  const [status, setStatus] = useState(complaint.status || 'open')
  const [note, setNote] = useState(complaint.resolution_note || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const dirty = status !== (complaint.status || 'open') || (note.trim() || '') !== (complaint.resolution_note || '')

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await api.updateStatus(complaint.id, status, status === 'resolved' ? note.trim() : note.trim() || null)
      onSaved(res.data)
    } catch (err) {
      const detail = err?.response?.data?.detail
      setError(typeof detail === 'string' && detail ? detail : 'Could not update status. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="priority-card">
      <div className="priority-card-top">
        <h4>⚠️ {complaint.text}</h4>
        <span className={`priority-badge ${(complaint.priority || 'low').toLowerCase()}`}>
          {cap(complaint.priority || 'low')} Priority
        </span>
      </div>
      <div className="priority-card-stats">
        <span>{complaint.anonymous ? 'Anonymous Employee' : complaint.employee_name || 'Employee'}</span>
        {complaint.department && <span>{complaint.department}</span>}
        {(complaint.theme || complaint.category) && <span>{complaint.theme || complaint.category}</span>}
        {complaint.created_at && <span>opened {ageOf(complaint.created_at)}</span>}
      </div>

      <div className="complaint-actions">
        <label className="section-label">Status</label>
        <div className="complaint-actions-row">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="date-select">
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
          </select>
          <button className="btn-primary" onClick={save} disabled={saving || !dirty}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
        {(status === 'resolved' || note) && (
          <>
            <label className="section-label" style={{ marginTop: 10 }}>
              {status === 'resolved' ? 'Resolution note (required)' : 'HR update'}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder={status === 'resolved' ? 'What was done to resolve this?' : 'Update for the employee…'}
              className="feedback-textarea"
            />
          </>
        )}
        {error && <p className="form-error" style={{ marginTop: 10, marginBottom: 0 }}>{error}</p>}
      </div>
    </div>
  )
}

export { STATUS_LABEL }
