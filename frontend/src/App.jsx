import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Employee from './pages/Employee'
import Analysis from './pages/Analysis'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/employee" replace />} />
        <Route path="/employee" element={<Employee />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/employee" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
