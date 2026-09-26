import { Link } from 'react-router-dom'

export default function Header({ anonymousMode, onToggleAnonymous }) {
  return (
    <header className="employee-header">
      <div className="employee-header-logo">
        <span className="logo-mark">IH</span>
        <span className="logo-text">InsightHR</span>
      </div>

      <nav className="employee-header-nav">
        <Link to="/employee" className="employee-nav-link active">Give Feedback</Link>
        <span className="employee-nav-link disabled">My Feedback</span>
      </nav>

      <div className="anonymous-toggle-group">
        <span>Anonymous Mode</span>
        <button
          type="button"
          className={'toggle-switch' + (anonymousMode ? ' on' : '')}
          onClick={() => onToggleAnonymous(!anonymousMode)}
          aria-pressed={anonymousMode}
          aria-label="Toggle anonymous mode"
        >
          <span className="toggle-knob" />
        </button>
      </div>
    </header>
  )
}
