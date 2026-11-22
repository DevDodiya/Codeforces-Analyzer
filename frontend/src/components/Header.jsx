import { Trophy } from 'lucide-react'

export default function Header() {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__logo">
          <Trophy size={24} />
        </span>
        <div>
          <h1 className="app-header__title">Codeforces Analyzer</h1>
          <p className="app-header__subtitle">
            Competitive programming profile &amp; problem-solving analytics
          </p>
        </div>
      </div>
    </header>
  )
}
