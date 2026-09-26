import { CheckCircle2 } from 'lucide-react'

export default function SubmissionSuccess({ onSubmitAnother }) {
  return (
    <div className="success-card">
      <CheckCircle2 size={48} className="success-icon" />
      <h2>Thank you!</h2>
      <p className="success-lead">Your feedback has been submitted successfully.</p>
      <p className="success-sub">Your voice helps create a better workplace.</p>
      <button className="btn-primary" onClick={onSubmitAnother}>Submit Another Response</button>
    </div>
  )
}
