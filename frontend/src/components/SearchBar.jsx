import { useState } from 'react'
import { Search } from 'lucide-react'

export default function SearchBar({ onSearch, loading }) {
  const [value, setValue] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const handle = value.trim()
    if (handle) onSearch(handle)
  }

  return (
    <form className="search-bar" onSubmit={submit}>
      <div className="search-bar__field">
        <Search size={18} className="search-bar__icon" />
        <input
          className="search-bar__input"
          type="text"
          placeholder="Enter a Codeforces handle (e.g. tourist)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
        />
      </div>
      <button className="search-bar__button" type="submit" disabled={loading || !value.trim()}>
        {loading ? 'Searching…' : 'Search'}
      </button>
    </form>
  )
}
