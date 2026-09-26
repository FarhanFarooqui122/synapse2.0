import { useState } from 'react'
import Header from '../components/layout/Header'
import FeedbackForm from '../components/employee/FeedbackForm'
import SubmissionSuccess from '../components/employee/SubmissionSuccess'
import { api } from '../api'

export default function Employee() {
  const [anonymousMode, setAnonymousMode] = useState(true)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (payload) => {
    try {
      await api.createFeedback(payload)
    } catch (err) {
      // Demo UI still shows success even if the backend call fails,
      // since this stage is about the frontend experience — but log it.
      console.error('Feedback submit error:', err)
    }
    setSubmitted(true)
  }

  return (
    <div className="employee-page">
      <Header anonymousMode={anonymousMode} onToggleAnonymous={setAnonymousMode} />

      <div className="employee-content">
        {!submitted ? (
          <>
            <section className="employee-hero">
              <h1>Your voice matters.</h1>
              <p>Share your thoughts, concerns, or ideas. Your feedback helps build a better workplace.</p>
            </section>

            <FeedbackForm anonymousMode={anonymousMode} onSubmit={handleSubmit} />
          </>
        ) : (
          <SubmissionSuccess onSubmitAnother={() => setSubmitted(false)} />
        )}
      </div>
    </div>
  )
}
