import { useState } from 'react'

export default function CompareBar({ onCompare, loading }) {
  const [a, setA] = useState('')
  const [b, setB] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const ha = a.trim()
    const hb = b.trim()
    if (ha && hb) onCompare(ha, hb)
  }

  const field = (value, setValue, placeholder) => (
    <input
      className="search-bar__input"
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      spellCheck={false}
      autoCapitalize="none"
      autoCorrect="off"
      autoComplete="off"
    />
  )

  return (
    <form className="compare-bar" onSubmit={submit}>
      {field(a, setA, 'First handle (e.g. tourist)')}
      <span className="compare-bar__vs">vs</span>
      {field(b, setB, 'Second handle (e.g. jiangly)')}
      <button
        className="search-bar__button"
        type="submit"
        disabled={loading || !a.trim() || !b.trim()}
      >
        {loading ? 'Comparing…' : 'Compare'}
      </button>
    </form>
  )
}
