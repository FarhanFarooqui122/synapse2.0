import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Brain, MessageSquare, LineChart, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, disabled: false },
  { to: '/analysis', label: 'AI Analysis', icon: Brain, disabled: false },
  { to: '/employee', label: 'Feedback', icon: MessageSquare, disabled: false },
  { to: '#', label: 'Trends', icon: LineChart, disabled: true },
  { to: '#', label: 'Settings', icon: Settings, disabled: true },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-mark">IH</span>
        <span className="logo-text">InsightHR</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon, disabled }) =>
          disabled ? (
            <span key={label} className="sidebar-link disabled">
              <Icon size={18} />
              {label}
            </span>
          ) : (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          )
        )}
      </nav>

      <div className="sidebar-profile">
        <span className="profile-avatar">HA</span>
        <span className="profile-name">HR Admin</span>
      </div>
    </aside>
  )
}
