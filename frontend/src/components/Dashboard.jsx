import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

/**
 * Generic bar chart for whatever numeric breakdown your PS needs:
 * spending by category, risk scores by applicant, claims by type, etc.
 * Just shape your data as [{ name: 'Food', value: 120 }, ...]
 */
export default function Dashboard({ data }) {
  if (!data || data.length === 0) {
    return <p className="empty-state">No data yet — add a record to see the chart.</p>
  }

  return (
    <div className="dashboard-card">
      <h3>Overview</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
