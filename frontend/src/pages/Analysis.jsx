import PageContainer from '../components/layout/PageContainer'
import AnalysisPipeline from '../components/analysis/AnalysisPipeline'
import SentimentAnalysis from '../components/analysis/SentimentAnalysis'
import ThemeAnalysis from '../components/analysis/ThemeAnalysis'
import EmotionAnalysis from '../components/analysis/EmotionAnalysis'
import PriorityScore from '../components/analysis/PriorityScore'
import AIInsight from '../components/analysis/AIInsight'
import { MOCK_ANALYSIS_SAMPLE } from '../data/mockData'

export default function Analysis() {
  const d = MOCK_ANALYSIS_SAMPLE

  return (
    <PageContainer>
      <div className="page-header">
        <h1>AI Feedback Analysis</h1>
        <p>See how employee feedback is transformed into measurable insights.</p>
      </div>

      <div className="card sample-feedback-card">
        <div className="card-header">
          <h3>Employee Feedback</h3>
        </div>
        <p className="sample-feedback-text">&ldquo;{d.text}&rdquo;</p>
        <div className="sample-meta">
          <span>Source: {d.source}</span>
          <span>Anonymous: {d.anonymous ? 'Yes' : 'No'}</span>
          <span>Submitted: {d.submitted}</span>
        </div>
      </div>

      <AnalysisPipeline activeIndex={6} />

      <div className="analysis-grid">
        <SentimentAnalysis data={d.sentiment} />
        <ThemeAnalysis data={d.theme} />
        <EmotionAnalysis data={d.emotion} />
        <PriorityScore data={d.priority} />
      </div>

      <AIInsight insight={d.insight} action={d.action} />
    </PageContainer>
  )
}