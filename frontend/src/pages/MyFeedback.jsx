import { useEffect, useState } from 'react'
import PageContainer from '../components/layout/PageContainer'
import { api } from '../api'
import { IDENTITY_KEY } from './Employee'

function cap(s) {
  if (!s) return ''
  return s[0].toUpperCase() + s.slice(1)
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(String(iso).replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatusBlock({ item }) {
  return (
    <div className="hr-update">
      <p><strong>Status:</strong> {cap(item.status || 'open')}</p>
      {item.resolution_note ? (
        <p><strong>HR update:</strong> {item.resolution_note}</p>
      ) : (
        <p className="pending">No HR update yet — your submission is still {item.status || 'open'}.</p>
      )}
      <p className="hr-update-date">Updated: {formatDate(item.updated_at || item.created_at)}</p>
    </div>
  )
}

export default function MyFeedback() {
  const [trackingInput, setTrackingInput] = useState('')
  const [tracked, setTracked] = useState(null)
  const [trackingError, setTrackingError] = useState('')
  const [checking, setChecking] = useState(false)

  const [name, setName] = useState('')
  const [mine, setMine] = useState(null) // null = not searched yet
  const [listError, setListError] = useState('')

  useEffect(() => {
    try {
      setName(localStorage.getItem(IDENTITY_KEY) || '')
    } catch {
      /* ignore */
    }
  }, [])

  const checkTracking = async (e) => {
    e?.preventDefault()
    const tid = trackingInput.trim().toUpperCase()
    if (!tid) return
    setChecking(true)
    setTrackingError('')
    setTracked(null)
    try {
      const res = await api.complaintStatus(tid)
      setTracked(res.data)
    } catch {
      setTrackingError('No complaint found for that ID. Check the ID and try again.')
    } finally {
      setChecking(false)
    }
  }

  const loadMine = async (e) => {
    e?.preventDefault()
    const who = name.trim()
    if (!who) return
    setListError('')
    try {
      const res = await api.listFeedback()
      const rows = (Array.isArray(res.data) ? res.data : []).filter(
        (f) => !f.anonymous && (f.employee_name || '').toLowerCase() === who.toLowerCase()
      )
      setMine(rows)
      try {
        localStorage.setItem(IDENTITY_KEY, who)
      } catch {
        /* ignore */
      }
    } catch {
      setListError('Could not load your feedback. Check that the backend is running.')
      setMine([])
    }
  }

  return (
    <PageContainer>
      <div className="page-header">
        <div>
          <h1>My Feedback</h1>
          <p>Track your complaints and see HR updates.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>Check Complaint Status</h3></div>
        <p className="privacy-desc" style={{ marginBottom: 12 }}>
          Submitted an <strong>anonymous</strong> complaint? Enter your Complaint ID
          (e.g. CMP-XXXXXXXX) to see its status and HR updates.
        </p>
        <form onSubmit={checkTracking} className="tracking-form">
          <input
            type="text"
            placeholder="CMP-XXXXXXXX"
            value={trackingInput}
            onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
            className="tracking-input"
          />
          <button type="submit" className="btn-primary" disabled={checking || !trackingInput.trim()}>
            {checking ? 'Checking…' : 'Check Status'}
          </button>
        </form>
        {trackingError && <p className="form-error" style={{ marginTop: 12 }}>{trackingError}</p>}
        {tracked && (
          <div className="tracked-result">
            <p><strong>Complaint:</strong> Anonymous</p>
            <StatusBlock item={tracked} />
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header"><h3>My Submitted Feedback</h3></div>
        <p className="privacy-desc" style={{ marginBottom: 12 }}>
          Enter the name you submitted with to see your non-anonymous feedback and
          HR updates. Anonymous submissions never appear here.
        </p>
        <form onSubmit={loadMine} className="tracking-form">
          <input
            type="text"
            placeholder="Employee name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="tracking-input"
          />
          <button type="submit" className="btn-secondary" disabled={!name.trim()}>
            Show My Feedback
          </button>
        </form>
        {listError && <p className="form-error" style={{ marginTop: 12 }}>{listError}</p>}
        {mine && mine.length === 0 && (
          <p className="privacy-desc" style={{ marginTop: 12 }}>No submissions found for that name.</p>
        )}
        {mine && mine.length > 0 && (
          <div className="my-list">
            {mine.map((f) => (
              <div key={f.id} className="my-item">
                <p className="my-item-text">
                  {f.feedback_type === 'complaint' ? '⚠️ ' : ''}&ldquo;{f.text}&rdquo;
                </p>
                <StatusBlock item={f} />
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
