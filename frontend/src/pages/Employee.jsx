import { useState } from 'react'
import PageContainer from '../components/layout/PageContainer'
import Header from '../components/layout/Header'
import FeedbackForm from '../components/employee/FeedbackForm'
import SubmissionSuccess from '../components/employee/SubmissionSuccess'
import { api } from '../api'

export const IDENTITY_KEY = 'insighthr_employee_name'

export default function Employee() {
  const [anonymousMode, setAnonymousMode] = useState(true)
  const [result, setResult] = useState(null) // saved record + tracking_id
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  const handleSubmit = async (payload) => {
    setSubmitting(true)
    setServerError('')
    try {
      const res = await api.createFeedback(payload)
      // Remember a non-anonymous identity locally so "My Feedback"
      // can show this employee their own submissions (demo only —
      // anonymous rows carry no name and can never match).
      if (!payload.anonymous && payload.employee_name) {
        try {
          localStorage.setItem(IDENTITY_KEY, payload.employee_name)
        } catch {
          /* private mode — My Feedback will just ask for the name */
        }
      }
      // Success screen ONLY after the backend confirms the save.
      setResult(res.data)
    } catch (err) {
      const detail = err?.response?.data?.detail
      setServerError(
        typeof detail === 'string' && detail
          ? detail
          : 'Could not submit feedback. Check that the backend is running and try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageContainer>
      <Header anonymousMode={anonymousMode} onToggleAnonymous={setAnonymousMode} />

      <div className="employee-content">
        {!result ? (
          <>
            <section className="employee-hero">
              <h1>Your voice matters.</h1>
              <p>Share your thoughts, concerns, or ideas. Your feedback helps build a better workplace.</p>
            </section>

            <FeedbackForm
              anonymousMode={anonymousMode}
              submitting={submitting}
              serverError={serverError}
              onSubmit={handleSubmit}
            />
          </>
        ) : (
          <SubmissionSuccess result={result} onSubmitAnother={() => setResult(null)} />
        )}
      </div>
    </PageContainer>
  )
}
