import axios from 'axios'

// VITE_API_BASE can point at a hosted backend; defaults to local dev.
const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8001/api'

export const api = {
  health: () => axios.get(`${API_BASE}/health`),

  listFeedback: () => axios.get(`${API_BASE}/feedback`),

  createFeedback: (feedback) => axios.post(`${API_BASE}/feedback`, feedback),

  deleteFeedback: (id) => axios.delete(`${API_BASE}/feedback/${id}`),

  generateInsights: () => axios.post(`${API_BASE}/insights`),

  slackFeedback: () => axios.get(`${API_BASE}/slack-feedback`),

  updateStatus: (id, status, resolution_note) =>
    axios.patch(`${API_BASE}/feedback/${id}/status`, { status, resolution_note }),

  complaintStatus: (trackingId) =>
    axios.get(`${API_BASE}/complaints/status/${encodeURIComponent(trackingId.trim())}`),
}
