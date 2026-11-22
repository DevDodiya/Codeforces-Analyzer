import { useState } from 'react'
import HandleInput from './HandleInput'

export default function SearchBar({ onSearch, onEdit, loading }) {
  const [value, setValue] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const handle = value.trim()
    if (handle) onSearch(handle)
  }

  const handleChange = (v) => {
    setValue(v)
    onEdit?.()
  }

  return (
    <form className="search-bar" onSubmit={submit} autoComplete="off">
      <HandleInput
        value={value}
        onChange={handleChange}
        onPick={(h) => onSearch(h)}
        onEnter={() => {
          const h = value.trim()
          if (h) onSearch(h)
        }}
        placeholder="Enter a Codeforces handle (e.g. tourist)"
        autoFocus
      />
      <button className="search-bar__button" type="submit" disabled={loading || !value.trim()}>
        {loading ? 'Searching…' : 'Search'}
      </button>
    </form>
  )
}
