import axios from 'axios'

const API_BASE = 'http://localhost:8000/api'

export const api = {
  health: () => axios.get(`${API_BASE}/health`),

  listRecords: () => axios.get(`${API_BASE}/records`),

  createRecord: (record) => axios.post(`${API_BASE}/records`, record),

  deleteRecord: (id) => axios.delete(`${API_BASE}/records/${id}`),

  // task: "general" | "categorize" | "fraud_check" | "risk_score"
  analyze: (text, task = 'general') =>
    axios.post(`${API_BASE}/analyze`, { text, task }),
}
