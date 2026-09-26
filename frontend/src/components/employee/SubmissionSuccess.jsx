import { Link } from 'react-router-dom'
import { CheckCircle2, Lock } from 'lucide-react'

export default function SubmissionSuccess({ result = {}, onSubmitAnother }) {
  const isComplaint = (result.feedback_type || 'feedback') === 'complaint'
  const trackingId = result.tracking_id

  return (
    <div className="success-card">
      {result.anonymous && isComplaint ? (
        <Lock size={48} className="success-icon" />
      ) : (
        <CheckCircle2 size={48} className="success-icon" />
      )}

      {!isComplaint && (
        <>
          <h2>Thank you!</h2>
          <p className="success-lead">Your feedback has been submitted successfully.</p>
          <p className="success-sub">Your voice helps create a better workplace.</p>
        </>
      )}

      {isComplaint && result.anonymous && (
        <>
          <h2>🔒 Anonymous complaint submitted</h2>
          <p className="success-lead">Your identity was not shared with HR.</p>
          <p className="success-sub">Save this Complaint ID to check for updates:</p>
          <p className="tracking-id">{trackingId}</p>
          <p className="success-sub">
            Enter it on the <Link to="/my-feedback">My Feedback</Link> page to see HR updates.
          </p>
        </>
      )}

      {isComplaint && !result.anonymous && (
        <>
          <h2>Complaint submitted successfully.</h2>
          <p className="success-lead">HR has received your complaint and will review it.</p>
          <p className="success-sub">
            You can check HR updates from <Link to="/my-feedback">My Feedback</Link>.
          </p>
        </>
      )}

      <button className="btn-primary" onClick={onSubmitAnother}>Submit Another Response</button>
    </div>
  )
}
