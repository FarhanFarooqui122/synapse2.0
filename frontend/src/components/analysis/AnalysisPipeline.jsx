const STAGES = [
  'Employee Feedback',
  'Speech-to-Text',
  'Sentiment Analysis',
  'Theme Detection',
  'Emotion Analysis',
  'Priority Scoring',
  'AI Insight',
]

export default function AnalysisPipeline({ activeIndex = -1 }) {
  return (
    <div className="pipeline">
      {STAGES.map((stage, i) => (
        <div key={stage} className="pipeline-stage-wrap">
          <div className={'pipeline-stage' + (i <= activeIndex ? ' complete' : '')}>
            <span className="pipeline-index">{i + 1}</span>
            <span>{stage}</span>
          </div>
          {i < STAGES.length - 1 && <div className="pipeline-connector" />}
        </div>
      ))}
    </div>
  )
}
