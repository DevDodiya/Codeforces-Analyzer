import { useState } from 'react'
import { Loader2, SearchX, AlertCircle } from 'lucide-react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import ProfileCard from './components/ProfileCard'
import { getUserInfo } from './api/codeforces'
import './App.css'

export default function App() {
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const [lastHandle, setLastHandle] = useState('')

  const handleSearch = async (handle) => {
    setStatus('loading')
    setError('')
    setUser(null)
    setLastHandle(handle)
    try {
      const data = await getUserInfo(handle)
      setUser(data)
      setStatus('success')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  return (
    <div className="app">
      <Header />
      <main className="app__main">
        <SearchBar onSearch={handleSearch} loading={status === 'loading'} />

        <div className="app__content">
          {status === 'idle' && (
            <div className="state state--idle">
              <SearchX size={40} />
              <p>Search a Codeforces handle to see their profile.</p>
            </div>
          )}

          {status === 'loading' && (
            <div className="state state--loading">
              <Loader2 size={40} className="spin" />
              <p>Fetching “{lastHandle}”…</p>
            </div>
          )}

          {status === 'error' && (
            <div className="state state--error">
              <AlertCircle size={40} />
              <p>{error}</p>
            </div>
          )}

          {status === 'success' && user && <ProfileCard user={user} />}
        </div>
      </main>
    </div>
  )
}
