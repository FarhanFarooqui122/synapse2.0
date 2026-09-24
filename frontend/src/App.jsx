import { useEffect, useState } from 'react'
import { api } from './api'
import Dashboard from './components/Dashboard'
import RecordForm from './components/RecordForm'
import AIPanel from './components/AIPanel'

function App() {
  const [records, setRecords] = useState([])

  const load = async () => {
    const res = await api.listRecords()
    setRecords(res.data)
  }

  useEffect(() => {
    load()
  }, [])

  const handleAdd = async (record) => {
    await api.createRecord(record)
    load()
  }

  const handleDelete = async (id) => {
    await api.deleteRecord(id)
    load()
  }

  // Aggregate records by category for the chart — adjust this
  // to whatever grouping makes sense for your actual PS.
  const chartData = Object.values(
    records.reduce((acc, r) => {
      const key = r.category || 'Uncategorized'
      if (!acc[key]) acc[key] = { name: key, value: 0 }
      acc[key].value += r.amount || 0
      return acc
    }, {})
  )

  return (
    <div className="app">
      <header>
        <h1>Synapse 1.0 — Project Dashboard</h1>
        <p className="subtitle">FinTech track starter — replace with your real PS</p>
      </header>

      <main>
        <section>
          <Dashboard data={chartData} />
        </section>

        <section className="two-col">
          <div>
            <h3>Add Record</h3>
            <RecordForm onAdd={handleAdd} />
            <ul className="record-list">
              {records.map((r) => (
                <li key={r.id}>
                  <span>{r.title} {r.category ? `(${r.category})` : ''} {r.amount ? `— ₹${r.amount}` : ''}</span>
                  <button onClick={() => handleDelete(r.id)}>✕</button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <AIPanel />
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
