import { useState, useRef, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'
import { getSuggestions, rankColor } from '../api/codeforces'

const DEBOUNCE_MS = 220

/**
 * A controlled Codeforces-handle text input with live autocomplete:
 * debounced + abortable fetches, a per-prefix client cache, keyboard navigation,
 * and a rich suggestion dropdown (avatar, rank-coloured handle, rating).
 *
 * Reused by both the single-profile search and the two compare fields.
 *
 * Props:
 *   value        current text (controlled by the parent)
 *   onChange     (string) => void  — called on every keystroke
 *   onPick       (handle) => void  — called when a suggestion is chosen
 *   onEnter      ()       => void  — Enter pressed with no active suggestion
 *   placeholder, autoFocus, icon
 */
export default function HandleInput({
  value,
  onChange,
  onPick,
  onEnter,
  placeholder,
  autoFocus = false,
  icon = true,
}) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  const containerRef = useRef(null)
  const debounceRef = useRef(null)
  const abortRef = useRef(null)
  const cacheRef = useRef(new Map())
  const skipNextFetch = useRef(false) // suppress the fetch triggered by selecting a suggestion

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
      if (abortRef.current) abortRef.current.abort()
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

  // Debounced fetch whenever the controlled value changes.
  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false
      return
    }
    const q = (value || '').trim()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q) {
      setSuggestions([])
      setOpen(false)
      setActive(-1)
      return
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(q), DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value, fetchSuggestions])

  const choose = (handle) => {
    skipNextFetch.current = true
    setOpen(false)
    setSuggestions([])
    setActive(-1)
    onChange(handle)
    onPick?.(handle)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (open && active >= 0 && active < suggestions.length) {
        e.preventDefault()
        choose(suggestions[active].handle)
      } else {
        setOpen(false)
        onEnter?.()
      }
      return
    }
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
    <div className="search-bar__field" ref={containerRef}>
      {icon && <Search size={18} className="search-bar__icon" />}
      <input
        className="search-bar__input"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        autoFocus={autoFocus}
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
                  e.preventDefault()
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
  )
}
