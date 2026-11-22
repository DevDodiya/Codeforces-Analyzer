import { useState } from 'react'
import HandleInput from './HandleInput'

export default function CompareBar({ onCompare, loading }) {
  const [a, setA] = useState('')
  const [b, setB] = useState('')

  const submit = (e) => {
    e?.preventDefault()
    const ha = a.trim()
    const hb = b.trim()
    if (ha && hb) onCompare(ha, hb)
  }

  return (
    <form className="compare-bar" onSubmit={submit} autoComplete="off">
      <HandleInput
        value={a}
        onChange={setA}
        onPick={setA}
        onEnter={submit}
        placeholder="First handle (e.g. tourist)"
      />
      <span className="compare-bar__vs">vs</span>
      <HandleInput
        value={b}
        onChange={setB}
        onPick={setB}
        onEnter={submit}
        placeholder="Second handle (e.g. jiangly)"
      />
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
