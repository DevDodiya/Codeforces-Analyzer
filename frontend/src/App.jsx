import { useState } from 'react'
import { Loader2, SearchX, AlertCircle } from 'lucide-react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import ProfileCard from './components/ProfileCard'
import StatCards from './components/StatCards'
import TagsChart from './components/TagsChart'
import { getUserInfo, getSolvedTags } from './api/codeforces'
import './App.css'

export default function App() {
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [user, setUser] = useState(null)
  const [tags, setTags] = useState(null)
  const [error, setError] = useState('')
  const [lastHandle, setLastHandle] = useState('')

  const handleSearch = async (handle) => {
    setStatus('loading')
    setError('')
    setUser(null)
    setTags(null)
    setLastHandle(handle)
    try {
      // Profile is required; tags are optional (don't fail the whole view if they error).
      const [data, tagData] = await Promise.all([
        getUserInfo(handle),
        getSolvedTags(handle).catch(() => null),
      ])
      setUser(data)
      setTags(tagData)
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

          {status === 'success' && user && (
            <div className="results">
              <ProfileCard user={user} />
              {tags && Object.keys(tags).length > 0 ? (
                <>
                  <StatCards tags={tags} />
                  <TagsChart tags={tags} />
                </>
              ) : (
                <p className="results__note">Tag analytics unavailable for this handle.</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
