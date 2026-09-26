/**
 * All demo/mock data lives here. Nothing in components should hardcode
 * numbers — swap this file out later for real API calls without touching
 * any component.
 */

// ---------- Feedback categories ----------
export const CATEGORIES = [
  'General',
  'Workload',
  'Management',
  'Work-Life Balance',
  'Compensation',
  'Culture',
  'Career Growth',
  'Facilities',
]

export const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'HR', 'Operations', 'Other']

// ---------- Realistic feedback pool, grouped by theme ----------
const FEEDBACK_POOL = [
  { text: "I've been working until 11 PM almost every day. There is too much work and our team is understaffed.", theme: 'Workload', sentiment: 'negative' },
  { text: 'Overtime has become the norm rather than the exception on my team.', theme: 'Workload', sentiment: 'negative' },
  { text: "We're consistently short-staffed during peak periods and it's affecting morale.", theme: 'Workload', sentiment: 'negative' },
  { text: 'The workload has been manageable this month, which is a nice change.', theme: 'Workload', sentiment: 'positive' },
  { text: 'My manager rarely shares updates from leadership meetings with the team.', theme: 'Management', sentiment: 'negative' },
  { text: "Communication from management feels inconsistent — sometimes we're informed, sometimes not.", theme: 'Management', sentiment: 'negative' },
  { text: 'Really appreciate how supportive my manager has been through a tough project.', theme: 'Management', sentiment: 'positive' },
  { text: 'My manager gives clear, actionable feedback in our 1:1s.', theme: 'Management', sentiment: 'positive' },
  { text: "I haven't taken a real day off in over a month.", theme: 'Work-Life Balance', sentiment: 'negative' },
  { text: 'It is hard to disconnect after hours — messages keep coming in late at night.', theme: 'Work-Life Balance', sentiment: 'negative' },
  { text: 'I appreciate that the team respects my calendar and weekends.', theme: 'Work-Life Balance', sentiment: 'positive' },
  { text: 'Flexible hours have made a real difference for my family situation.', theme: 'Work-Life Balance', sentiment: 'positive' },
  { text: 'Salaries here feel below market rate compared to similar roles elsewhere.', theme: 'Compensation', sentiment: 'negative' },
  { text: 'I was surprised there was no raise this year despite strong performance reviews.', theme: 'Compensation', sentiment: 'negative' },
  { text: 'The bonus structure this year felt fair given the results we delivered.', theme: 'Compensation', sentiment: 'neutral' },
  { text: 'Really appreciate how supportive my teammates are, we genuinely look out for each other.', theme: 'Culture', sentiment: 'positive' },
  { text: 'The team culture is collaborative and people are quick to help when you are stuck.', theme: 'Culture', sentiment: 'positive' },
  { text: 'There is a lack of transparency around decisions that affect the whole team.', theme: 'Culture', sentiment: 'negative' },
  { text: "I don't see a clear path for promotion in my current role.", theme: 'Career Growth', sentiment: 'negative' },
  { text: 'Would love more mentorship opportunities or a clearer growth ladder.', theme: 'Career Growth', sentiment: 'neutral' },
  { text: 'My manager helped me put together a solid development plan this quarter.', theme: 'Career Growth', sentiment: 'positive' },
  { text: 'The office facilities could be improved — the meeting rooms are often booked or too small.', theme: 'Facilities', sentiment: 'neutral' },
  { text: 'The new office kitchen setup is a great addition.', theme: 'Facilities', sentiment: 'positive' },
  { text: 'Wanted to share that onboarding this month went smoothly overall.', theme: 'General', sentiment: 'neutral' },
  { text: 'Nothing specific to raise, just wanted to check in and say things are going okay.', theme: 'General', sentiment: 'neutral' },
]

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function formatRelative(date) {
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000)
  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  const weeks = Math.floor(diffDays / 7)
  return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
}

// ---------- Generate ~90 feedback records spread over 90 days ----------
const rand = seededRandom(42)

export const MOCK_FEEDBACK = Array.from({ length: 90 }).map((_, i) => {
  const item = FEEDBACK_POOL[Math.floor(rand() * FEEDBACK_POOL.length)]
  // Bias more workload/negative entries toward recent days so the trend looks realistic
  const dayOffset = Math.floor(rand() * 90)
  const date = daysAgo(dayOffset)
  const priority =
    item.sentiment === 'negative' && (item.theme === 'Workload' || item.theme === 'Management')
      ? 'High'
      : item.sentiment === 'negative'
      ? 'Medium'
      : 'Low'

  return {
    id: i + 1,
    text: item.text,
    theme: item.theme,
    sentiment: item.sentiment,
    priority,
    department: DEPARTMENTS[Math.floor(rand() * DEPARTMENTS.length)],
    anonymous: rand() > 0.3,
    date,
    dateLabel: formatRelative(date),
  }
}).sort((a, b) => b.date - a.date)

// ---------- KPIs ----------
export const MOCK_KPIS = {
  totalFeedback: 248,
  totalFeedbackTrend: '+18%',
  positive: 42,
  neutral: 36,
  negative: 22,
  highPriority: 17,
}

// ---------- Sentiment trend over time (for the line chart) ----------
export function buildSentimentTrend(range = 30) {
  const points = []
  for (let i = range - 1; i >= 0; i--) {
    const date = daysAgo(i)
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    // Slight upward drift in negative sentiment over time, for a believable "emerging concern" story
    const progress = (range - i) / range
    const negative = Math.round(15 + progress * 20 + rand() * 8)
    const positive = Math.round(50 - progress * 12 + rand() * 8)
    const neutral = Math.max(0, 100 - negative - positive)
    points.push({ date: label, Positive: positive, Neutral: neutral, Negative: negative })
  }
  return points
}

// ---------- Top concerns ----------
export const MOCK_TOP_CONCERNS = [
  { theme: 'Workload', percent: 38, trend: '+58%' },
  { theme: 'Management', percent: 24, trend: '+21%' },
  { theme: 'Work-Life Balance', percent: 19, trend: '+9%' },
  { theme: 'Compensation', percent: 11, trend: '-4%' },
  { theme: 'Culture', percent: 8, trend: '+2%' },
]

// ---------- Priority issues ----------
export const MOCK_PRIORITY_ISSUES = [
  {
    id: 1,
    title: 'Workload / Overtime',
    mentions: 38,
    trend: '+58%',
    negativeSentiment: 91,
    priority: 'High',
  },
  {
    id: 2,
    title: 'Management Communication',
    mentions: 24,
    trend: '+21%',
    negativeSentiment: 74,
    priority: 'Medium',
  },
]

// ---------- Emotion breakdown ----------
export const MOCK_EMOTIONS = [
  { name: 'Sadness', value: 72, color: '#5B6CDA' },
  { name: 'Anger', value: 18, color: '#DC2626' },
  { name: 'Neutral', value: 6, color: '#94A3B8' },
  { name: 'Joy', value: 4, color: '#16A34A' },
]

export const MOCK_EMOTIONS_DASHBOARD = [
  { name: 'Sadness', value: 34, color: '#5B6CDA' },
  { name: 'Anger', value: 21, color: '#DC2626' },
  { name: 'Joy', value: 28, color: '#16A34A' },
  { name: 'Fear', value: 9, color: '#D97706' },
  { name: 'Neutral', value: 8, color: '#94A3B8' },
]

// ---------- AI-generated organizational insights ----------
export const MOCK_ORG_INSIGHTS = [
  {
    title: 'Workload is emerging as the primary concern',
    body: 'Workload-related feedback has increased significantly compared with the previous period.',
    badge: 'HIGH PRIORITY',
    tone: 'negative',
  },
  {
    title: 'Management communication needs attention',
    body: 'Multiple employees have mentioned communication gaps and difficulty receiving timely updates.',
    badge: 'MEDIUM PRIORITY',
    tone: 'medium',
  },
  {
    title: 'Positive culture signals',
    body: 'Employees frequently mention supportive teammates and collaborative work environments.',
    badge: 'POSITIVE',
    tone: 'positive',
  },
]

// ---------- Sample feedback + full pipeline for the Analysis page ----------
export const MOCK_ANALYSIS_SAMPLE = {
  text: "I've been working until 11 PM almost every day. There is too much work and our team is understaffed.",
  source: 'Voice',
  anonymous: true,
  submitted: 'Today',
  sentiment: {
    label: 'Negative',
    confidence: 94,
    breakdown: { positive: 2, neutral: 4, negative: 94 },
    model: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
  },
  theme: {
    primary: 'Workload',
    similarity: 87,
    secondary: ['Overtime', 'Staffing', 'Work-Life Balance'],
    model: 'sentence-transformers/all-MiniLM-L6-v2',
  },
  emotion: MOCK_EMOTIONS,
  priority: {
    score: 87,
    label: 'HIGH PRIORITY',
    factors: ['Negative sentiment', 'High frequency', 'Increasing trend', 'Workload indicators'],
  },
  insight: 'Workload-related concerns appear to be increasing, with employees frequently mentioning excessive overtime and insufficient staffing.',
  action: 'Review workload distribution and staffing levels. Monitor overtime-related feedback over the next 30 days.',
}
