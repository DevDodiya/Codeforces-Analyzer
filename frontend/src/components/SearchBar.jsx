import { useState, useRef, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'
import { getSuggestions, rankColor } from '../api/codeforces'

const DEBOUNCE_MS = 220

export default function SearchBar({ onSearch, loading }) {
  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  const containerRef = useRef(null)
  const debounceRef = useRef(null)
  const abortRef = useRef(null)
  const cacheRef = useRef(new Map()) // per-prefix result cache (avoids refetch on backspace/retype)

  // Close the dropdown on an outside click.
  useEffect(() => {
    const onDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  const applyResults = useCallback((list) => {
    setSuggestions(list)
    setOpen(list.length > 0)
    setActive(-1)
  }, [])

  const fetchSuggestions = useCallback(
    (q) => {
      const key = q.toLowerCase()
      if (cacheRef.current.has(key)) {
        applyResults(cacheRef.current.get(key))
        return
      }
      if (abortRef.current) abortRef.current.abort() // cancel superseded request
      const controller = new AbortController()
      abortRef.current = controller
      getSuggestions(q, controller.signal).then((list) => {
        if (controller.signal.aborted) return
        cacheRef.current.set(key, list)
        applyResults(list)
      })
    },
    [applyResults],
  )

  const onChange = (e) => {
    const v = e.target.value
    setValue(v)
    setActive(-1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = v.trim()
    if (!q) {
      setSuggestions([])
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(q), DEBOUNCE_MS)
  }

  const choose = (handle) => {
    setValue(handle)
    setOpen(false)
    setSuggestions([])
    onSearch(handle)
  }

  const submit = (e) => {
    e.preventDefault()
    if (open && active >= 0 && active < suggestions.length) {
      choose(suggestions[active].handle)
      return
    }
    const handle = value.trim()
    if (handle) {
      setOpen(false)
      onSearch(handle)
    }
  }

  const onKeyDown = (e) => {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <form className="search-bar" onSubmit={submit} ref={containerRef} autoComplete="off">
      <div className="search-bar__field">
        <Search size={18} className="search-bar__icon" />
        <input
          className="search-bar__input"
          type="text"
          placeholder="Enter a Codeforces handle (e.g. tourist)"
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          autoFocus
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
        />
        {open && suggestions.length > 0 && (
          <ul className="search-suggestions" role="listbox">
            {suggestions.map((s, i) => {
              const color = rankColor(s.rank)
              return (
                <li
                  key={s.handle}
                  role="option"
                  aria-selected={i === active}
                  className={'suggestion' + (i === active ? ' suggestion--active' : '')}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    e.preventDefault() // keep focus; fire before blur
                    choose(s.handle)
                  }}
                >
                  <img
                    className="suggestion__avatar"
                    src={s.avatar || s.titlePhoto}
                    alt=""
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.visibility = 'hidden'
                    }}
                  />
                  <span className="suggestion__handle" style={{ color }}>
                    {s.handle}
                  </span>
                  {s.rank && <span className="suggestion__rank">{s.rank}</span>}
                  {s.rating ? (
                    <span className="suggestion__rating" style={{ color }}>
                      {s.rating}
                    </span>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <button className="search-bar__button" type="submit" disabled={loading || !value.trim()}>
        {loading ? 'Searching…' : 'Search'}
      </button>
    </form>
  )
}
