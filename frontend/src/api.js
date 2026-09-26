import axios from 'axios'

const API_BASE = 'http://localhost:8000/api'

export const api = {
  health: () => axios.get(`${API_BASE}/health`),

  listFeedback: () => axios.get(`${API_BASE}/feedback`),

  createFeedback: (feedback) => axios.post(`${API_BASE}/feedback`, feedback),

  deleteFeedback: (id) => axios.delete(`${API_BASE}/feedback/${id}`),

  generateInsights: () => axios.post(`${API_BASE}/insights`),
}
