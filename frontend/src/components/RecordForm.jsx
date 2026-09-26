import { useState } from 'react'

export default function RecordForm({ onAdd }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!title) return
    onAdd({ title, category, amount: amount ? parseFloat(amount) : null })
    setTitle('')
    setCategory('')
    setAmount('')
  }

  return (
    <form className="record-form" onSubmit={submit}>
      <input
        placeholder="Title (e.g. Grocery purchase)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />
      <input
        placeholder="Amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button type="submit">Add</button>
    </form>
  )
}
