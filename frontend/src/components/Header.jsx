import { Trophy, Home } from 'lucide-react'

export default function Header({ onHome, showHome }) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <button
          type="button"
          className="app-header__brand"
          onClick={onHome}
          title="Back to home"
          aria-label="Back to home"
        >
          <span className="app-header__logo">
            <Trophy size={24} />
          </span>
          <div className="app-header__text">
            <h1 className="app-header__title">Codeforces Analyzer</h1>
            <p className="app-header__subtitle">
              Competitive programming profile &amp; problem-solving analytics
            </p>
          </div>
        </button>

        {showHome && (
          <button type="button" className="app-header__home" onClick={onHome}>
            <Home size={16} />
            <span>Home</span>
          </button>
        )}
      </div>
    </header>
  )
}
