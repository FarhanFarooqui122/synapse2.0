import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Brain, MessageSquare, Inbox, LineChart, Settings, Menu, X, User } from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/analysis', label: 'AI Analysis', icon: Brain },
  { to: '/employee', label: 'Feedback', icon: MessageSquare },
  { to: '/my-feedback', label: 'My Feedback', icon: Inbox },
  { to: '#', label: 'Trends', icon: LineChart, disabled: true },
  { to: '#', label: 'Settings', icon: Settings, disabled: true },
]

export default function TopNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="top-navbar">
      <div className="navbar-brand">
        <span className="logo-mark">IH</span>
        <span className="logo-text">InsightHR</span>
      </div>

      <button
        className="mobile-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-expanded={mobileMenuOpen}
        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <nav className={`navbar-nav ${mobileMenuOpen ? 'open' : ''}`}>
        {NAV_ITEMS.map(({ to, label, icon: Icon, disabled }) =>
          disabled ? (
            <span key={label} className="nav-link disabled">
              <Icon size={18} />
              {label}
            </span>
          ) : (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          )
        )}
      </nav>

      <div className="navbar-profile">
        <span className="profile-avatar">HA</span>
        <span className="profile-name">HR Admin</span>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}
    </header>
  )
}