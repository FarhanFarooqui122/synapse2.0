import { useEffect, useMemo, useState } from 'react'
import { MessageSquare, Smile, Meh, Frown, AlertTriangle, ShieldAlert, Download, Sparkles } from 'lucide-react'
import PageContainer from '../components/layout/PageContainer'
import KPICard from '../components/dashboard/KPICard'
import SentimentTrend from '../components/dashboard/SentimentTrend'
import TopConcerns from '../components/dashboard/TopConcerns'
import PriorityIssueCard from '../components/dashboard/PriorityIssueCard'
import ComplaintCard from '../components/dashboard/ComplaintCard'
import EmotionChart from '../components/dashboard/EmotionChart'
import AIInsightCard from '../components/dashboard/AIInsightCard'
import RecentFeedback from '../components/dashboard/RecentFeedback'
import SlackFeedback from '../components/slack/SlackFeedback'
import { api } from '../api'

const RANGE_DAYS = { 'Last 7 Days': 7, 'Last 30 Days': 30, 'Last 3 Months': 90 }
const EMOTION_COLORS = ['#5B6CDA', '#DC2626', '#16A34A', '#D97706', '#94A3B8', '#8B5CF6']
const TONE = { high: 'negative', medium: 'medium', low: 'positive' }

function parseDate(iso) {
  if (!iso) return null
  const d = new Date(String(iso).replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? null : d
}

function cap(s) {
  if (!s) return ''
  return s[0].toUpperCase() + s.slice(1)
}

export default function Dashboard() {
  const [dateRange, setDateRange] = useState('Last 30 Days')
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [insights, setInsights] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [insightsError, setInsightsError] = useState('')

  const loadFeedback = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.listFeedback()
      setFeedback(Array.isArray(res.data) ? res.data : [])
    } catch {
      setError('Could not load feedback. Check that the backend is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadFeedback() }, [])

  const filtered = useMemo(() => {
    const cutoff = Date.now() - (RANGE_DAYS[dateRange] || 30) * 86400000
    return feedback.filter((f) => {
      const d = parseDate(f.created_at)
      return !d || d.getTime() >= cutoff
    })
  }, [feedback, dateRange])

  const kpis = useMemo(() => {
    const labeled = filtered.filter((f) => f.sentiment)
    const count = (s) => labeled.filter((f) => f.sentiment === s).length
    const pct = (n) => (labeled.length ? Math.round((n / labeled.length) * 100) : null)
    const pos = count('positive'), neu = count('neutral'), neg = count('negative')
    return {
      total: filtered.length,
      positive: pct(pos), neutral: pct(neu), negative: pct(neg),
      highPriority: filtered.filter((f) => f.priority === 'high').length,
      openComplaints: filtered.filter(
        (f) => (f.feedback_type || 'feedback') === 'complaint' && (f.status || 'open') === 'open'
      ).length,
    }
  }, [filtered])

  const trendData = useMemo(() => {
    const days = RANGE_DAYS[dateRange] || 30
    const points = []
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date()
      day.setDate(day.getDate() - i)
      const key = day.toDateString()
      const label = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      let Positive = 0, Neutral = 0, Negative = 0
      filtered.forEach((f) => {
        const d = parseDate(f.created_at)
        if (d && d.toDateString() === key) {
          if (f.sentiment === 'positive') Positive++
          else if (f.sentiment === 'neutral') Neutral++
          else if (f.sentiment === 'negative') Negative++
        }
      })
      points.push({ date: label, Positive, Neutral, Negative })
    }
    return points
  }, [filtered, dateRange])

  const concernItems = useMemo(() => {
    if (insights?.themes?.length) {
      const total = insights.themes.reduce((s, t) => s + (t.count || 0), 0) || 1
      return insights.themes.map((t) => ({
        theme: t.name,
        count: t.count,
        percent: Math.round(((t.count || 0) / total) * 100),
      }))
    }
    const counts = {}
    filtered.forEach((f) => {
      const theme = f.theme || f.category
      if (theme) counts[theme] = (counts[theme] || 0) + 1
    })
    const total = Object.values(counts).reduce((s, n) => s + n, 0) || 1
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme, n]) => ({ theme, count: n, percent: Math.round((n / total) * 100) }))
  }, [insights, filtered])

  const emotionData = useMemo(() => {    const counts = {}
    filtered.forEach((f) => {
      if (f.emotion) counts[cap(f.emotion)] = (counts[cap(f.emotion)] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({ name, value, color: EMOTION_COLORS[i % EMOTION_COLORS.length] }))
  }, [filtered])

  const activeComplaints = useMemo(() => (
    filtered
      .filter((f) => (f.feedback_type || 'feedback') === 'complaint' && (f.status || 'open') !== 'resolved')
      .sort((a, b) => b.id - a.id)
  ), [filtered])

  const handleStatusSaved = (updated) => {
    setFeedback((prev) => prev.map((f) => (f.id === updated.id ? { ...f, ...updated } : f)))
  }

  const generateInsights = async () => {
    setAnalyzing(true)
    setInsightsError('')
    try {
      const res = await api.generateInsights()
      setInsights(res.data)
    } catch (err) {
      const detail = err?.response?.data?.detail
      setInsightsError(
        typeof detail === 'string' && detail
          ? detail
          : 'AI analysis failed. Try again.'
      )
    } finally {
      setAnalyzing(false)
    }
  }

  const exportCsv = () => {
    const rows = [['id', 'text', 'source', 'category', 'department', 'anonymous',
      'sentiment', 'theme', 'emotion', 'priority', 'feedback_type', 'status',
      'resolution_note', 'created_at']]
    filtered.forEach((f) => rows.push([
      f.id, `"${String(f.text || '').replace(/"/g, '""')}"`, f.source, f.category,
      f.department, f.anonymous, f.sentiment, f.theme, f.emotion, f.priority,
      f.feedback_type, f.status, `"${String(f.resolution_note || '').replace(/"/g, '""')}"`,
      f.created_at,
    ]))
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'insighthr-feedback.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const pct = (v) => (v == null ? '—' : `${v}%`)

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
          <button className="btn-secondary" onClick={exportCsv} disabled={!filtered.length}>
            <Download size={15} /> Export Report
          </button>
          <button className="btn-primary" onClick={generateInsights} disabled={analyzing || !feedback.length}>
            <Sparkles size={15} /> {analyzing ? 'Analyzing…' : 'Generate AI Insights'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="card state-card"><h3>Loading feedback…</h3><p>Fetching records from the database.</p></div>
      )}

      {!loading && error && (
        <div className="card state-card">
          <h3>Couldn&apos;t load the dashboard</h3>
          <p>{error}</p>
          <button className="btn-primary" onClick={loadFeedback}>Retry</button>
        </div>
      )}

      {!loading && !error && feedback.length === 0 && (
        <div className="card state-card">
          <h3>No employee feedback yet</h3>
          <p>Submit feedback from the Employee Feedback page to start generating insights.</p>
        </div>
      )}

      {!loading && !error && feedback.length > 0 && (
        <>
          <div className="kpi-row">
            <KPICard icon={MessageSquare} label="Total Feedback" value={kpis.total} accent={{ bg: '#EEF2FF', fg: '#4F46E5' }} />
            <KPICard icon={Smile} label="Positive" value={pct(kpis.positive)} accent={{ bg: '#ECFDF3', fg: '#16A34A' }} />
            <KPICard icon={Meh} label="Neutral" value={pct(kpis.neutral)} accent={{ bg: '#F2F4F7', fg: '#667085' }} />
            <KPICard icon={Frown} label="Negative" value={pct(kpis.negative)} accent={{ bg: '#FEF3F2', fg: '#DC2626' }} />
            <KPICard icon={AlertTriangle} label="High Priority" value={kpis.highPriority} accent={{ bg: '#FFFAEB', fg: '#D97706' }} />
            <KPICard icon={ShieldAlert} label="Open Complaints" value={kpis.openComplaints} accent={{ bg: '#FEF3F2', fg: '#B42318' }} />
          </div>

          {insightsError && <p className="form-error">{insightsError}</p>}

          {insights?.summary && (
            <div className="card ai-insight-highlight">
              <div className="card-header"><Sparkles size={18} /><h3>AI Organizational Summary</h3></div>
              <p className="ai-insight-text">{insights.summary}</p>
            </div>
          )}

          <SentimentTrend data={trendData} />

          <div className="two-col-grid">
            <TopConcerns items={concernItems} />
            {emotionData.length > 0 ? (
              <EmotionChart data={emotionData} />
            ) : (
              <div className="card">
                <div className="card-header"><h3>Employee Emotions</h3></div>
                <div className="state-card" style={{ padding: '28px 16px' }}>
                  <h3>No emotion data yet</h3>
                  <p>Emotion insights will appear as more feedback is analyzed.</p>
                </div>
              </div>
            )}
          </div>

          {insights?.concerns?.length > 0 && (
            <>
              <div className="page-header"><h2>Priority Issues</h2></div>
              <div className="priority-issues-row">
                {insights.concerns.map((c, i) => (
                  <PriorityIssueCard
                    key={c.title || i}
                    issue={{
                      title: c.title,
                      description: c.description,
                      priority: cap(c.severity || 'medium'),
                      mentions: c.evidence_count || null,
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {insights?.actionable_insights?.length > 0 && (
            <>
              <div className="page-header"><h2>AI-Generated Insights</h2></div>
              <div className="insight-row">
                {insights.actionable_insights.map((ins, i) => (
                  <AIInsightCard
                    key={ins.title || i}
                    title={ins.title}
                    body={ins.description}
                    badge={`${(ins.priority || 'medium').toUpperCase()} PRIORITY`}
                    tone={TONE[ins.priority] || 'medium'}
                  />
                ))}
              </div>
            </>
          )}

          <div className="page-header"><h2>Active Complaints</h2></div>
          {activeComplaints.length === 0 ? (
            <div className="card state-card" style={{ padding: '28px 16px' }}>
              <h3>No active complaints</h3>
              <p>New complaints from employees will appear here for HR action.</p>
            </div>
          ) : (
            <div className="priority-issues-row">
              {activeComplaints.map((c) => (
                <ComplaintCard key={c.id} complaint={c} onSaved={handleStatusSaved} />
              ))}
            </div>
          )}

          <RecentFeedback items={filtered.slice(0, 8)} onItemUpdated={handleStatusSaved} />
          <SlackFeedback />
        </>
      )}
    </PageContainer>
  )
}
