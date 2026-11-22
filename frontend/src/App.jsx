import { useState } from 'react'
import { Loader2, SearchX, AlertCircle } from 'lucide-react'

function GithubMark(props) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.1-.75.4-1.27.73-1.56-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.28 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  )
}
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import ProfileCard from './components/ProfileCard'
import StatCards from './components/StatCards'
import RatingChart from './components/RatingChart'
import DifficultyChart from './components/DifficultyChart'
import TagsChart from './components/TagsChart'
import BlogsSection from './components/BlogsSection'
import {
  getUserInfo,
  getSolvedTags,
  getRatingHistory,
  getDifficultyDistribution,
  getUserBlogs,
} from './api/codeforces'
import './App.css'

const EXAMPLES = ['tourist', 'jiangly', 'Benq', 'Petr', 'Errichto']

export default function App() {
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [user, setUser] = useState(null)
  const [tags, setTags] = useState(null)
  const [history, setHistory] = useState(null)
  const [difficulty, setDifficulty] = useState(null)
  const [blogs, setBlogs] = useState(null)
  const [error, setError] = useState('')
  const [lastHandle, setLastHandle] = useState('')

  const handleSearch = async (handle) => {
    setStatus('loading')
    setError('')
    setUser(null)
    setTags(null)
    setHistory(null)
    setDifficulty(null)
    setBlogs(null)
    setLastHandle(handle)
    try {
      // Profile is required; analytics are optional and fail independently.
      const [data, tagData, historyData, difficultyData, blogData] = await Promise.all([
        getUserInfo(handle),
        getSolvedTags(handle).catch(() => null),
        getRatingHistory(handle).catch(() => null),
        getDifficultyDistribution(handle).catch(() => null),
        getUserBlogs(handle).catch(() => null),
      ])
      setUser(data)
      setTags(tagData)
      setHistory(historyData)
      setDifficulty(difficultyData)
      setBlogs(blogData)
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
              <p>Search a Codeforces handle to explore their competitive-programming profile.</p>
              <div className="examples">
                <span className="examples__label">Try:</span>
                {EXAMPLES.map((h) => (
                  <button key={h} className="chip" onClick={() => handleSearch(h)}>
                    {h}
                  </button>
                ))}
              </div>
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
              {tags && Object.keys(tags).length > 0 && <StatCards tags={tags} />}
              {history && <RatingChart history={history} />}
              {difficulty && Object.keys(difficulty).length > 0 && (
                <DifficultyChart distribution={difficulty} />
              )}
              {tags && Object.keys(tags).length > 0 && <TagsChart tags={tags} />}
              {blogs && blogs.length > 0 && <BlogsSection blogs={blogs} />}
              {!tags && !history && !difficulty && (
                <p className="results__note">Analytics are unavailable for this handle right now.</p>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <span>
          Built with <strong>Quarkus</strong> · <strong>React</strong> · <strong>Recharts</strong>
        </span>
        <a
          className="app-footer__link"
          href="https://github.com/DevDodiya/Codeforces-Analyzer"
          target="_blank"
          rel="noreferrer"
        >
          <GithubMark /> Source
        </a>
      </footer>
    </div>
  )
}
