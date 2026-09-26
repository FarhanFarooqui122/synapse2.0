import { useState } from 'react'
import { MessageSquare, Smile, Meh, Frown, AlertTriangle, Download } from 'lucide-react'
import PageContainer from '../components/layout/PageContainer'
import KPICard from '../components/dashboard/KPICard'
import SentimentTrend from '../components/dashboard/SentimentTrend'
import TopConcerns from '../components/dashboard/TopConcerns'
import PriorityIssueCard from '../components/dashboard/PriorityIssueCard'
import EmotionChart from '../components/dashboard/EmotionChart'
import AIInsightCard from '../components/dashboard/AIInsightCard'
import RecentFeedback from '../components/dashboard/RecentFeedback'
import {
  MOCK_KPIS,
  MOCK_PRIORITY_ISSUES,
  MOCK_EMOTIONS_DASHBOARD,
  MOCK_ORG_INSIGHTS,
  MOCK_FEEDBACK,
} from '../data/mockData'

export default function Dashboard() {
  const [dateRange, setDateRange] = useState('Last 30 Days')

  return (
    <PageContainer>
      <div className="page-header dashboard-header">
        <div>
          <h1>HR Insights</h1>
          <p>Understand what your employees are saying.</p>
        </div>
        <div className="dashboard-header-actions">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="date-select">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 3 Months</option>
          </select>
          <button className="btn-secondary"><Download size={15} /> Export Report</button>
        </div>
      </div>

      <div className="kpi-row">
        <KPICard icon={MessageSquare} label="Total Feedback" value={MOCK_KPIS.totalFeedback} trend={`↑ ${MOCK_KPIS.totalFeedbackTrend.replace('+', '')}`} trendTone="positive" accent={{ bg: '#EEF2FF', fg: '#4F46E5' }} />
        <KPICard icon={Smile} label="Positive" value={`${MOCK_KPIS.positive}%`} accent={{ bg: '#ECFDF3', fg: '#16A34A' }} />
        <KPICard icon={Meh} label="Neutral" value={`${MOCK_KPIS.neutral}%`} accent={{ bg: '#F2F4F7', fg: '#667085' }} />
        <KPICard icon={Frown} label="Negative" value={`${MOCK_KPIS.negative}%`} accent={{ bg: '#FEF3F2', fg: '#DC2626' }} />
        <KPICard icon={AlertTriangle} label="High Priority" value={MOCK_KPIS.highPriority} accent={{ bg: '#FFFAEB', fg: '#D97706' }} />
      </div>

      <SentimentTrend />

      <div className="two-col-grid">
        <TopConcerns />
        <EmotionChart data={MOCK_EMOTIONS_DASHBOARD} />
      </div>

      <div className="page-header">
        <h2>Priority Issues</h2>
      </div>
      <div className="priority-issues-row">
        {MOCK_PRIORITY_ISSUES.map((issue) => (
          <PriorityIssueCard key={issue.id} issue={issue} onView={() => {}} />
        ))}
      </div>

      <div className="page-header">
        <h2>AI-Generated Insights</h2>
      </div>
      <div className="insight-row">
        {MOCK_ORG_INSIGHTS.map((insight) => (
          <AIInsightCard key={insight.title} {...insight} />
        ))}
      </div>

      <RecentFeedback items={MOCK_FEEDBACK.slice(0, 8)} />
    </PageContainer>
  )
}
