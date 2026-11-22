import CompareChart from './CompareChart'

// Fixed slot colours so the two users are always visually distinct,
// even when both share the same Codeforces rank colour.
const COLOR_A = '#3b82f6'
const COLOR_B = '#f59e0b'

function UserHead({ user, color, align }) {
  return (
    <div className={'compare-head__user compare-head__user--' + align}>
      <img
        className="compare-head__avatar"
        src={user.avatar || user.titlePhoto}
        alt=""
        style={{ borderColor: color }}
        referrerPolicy="no-referrer"
      />
      <a
        className="compare-head__handle"
        href={`https://codeforces.com/profile/${user.handle}`}
        target="_blank"
        rel="noreferrer"
        style={{ color }}
      >
        {user.handle}
      </a>
      <span className="compare-head__rank">{user.rank || 'unrated'}</span>
    </div>
  )
}

export default function CompareView({ a, b }) {
  const ua = a.user
  const ub = b.user

  const rows = [
    { label: 'Current Rating', av: ua.rating, bv: ub.rating },
    { label: 'Max Rating', av: ua.maxRating, bv: ub.maxRating },
    { label: 'Contribution', av: ua.contribution, bv: ub.contribution },
    { label: 'Friends', av: ua.friendOfCount, bv: ub.friendOfCount },
    { label: 'Rated Contests', av: (a.history || []).length, bv: (b.history || []).length },
  ]

  const fmt = (n) => (typeof n === 'number' ? n.toLocaleString() : n)

  return (
    <div className="results">
      <section className="chart-card">
        <div className="compare-head">
          <UserHead user={ua} color={COLOR_A} align="left" />
          <span className="compare-head__vs">VS</span>
          <UserHead user={ub} color={COLOR_B} align="right" />
        </div>

        <ul className="compare-metrics">
          {rows.map((r) => {
            const aWin = r.av > r.bv
            const bWin = r.bv > r.av
            return (
              <li className="compare-row" key={r.label}>
                <span
                  className={'compare-row__val' + (aWin ? ' is-win' : '')}
                  style={aWin ? { color: COLOR_A } : undefined}
                >
                  {fmt(r.av)}
                </span>
                <span className="compare-row__label">{r.label}</span>
                <span
                  className={'compare-row__val compare-row__val--right' + (bWin ? ' is-win' : '')}
                  style={bWin ? { color: COLOR_B } : undefined}
                >
                  {fmt(r.bv)}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <CompareChart a={a} b={b} colorA={COLOR_A} colorB={COLOR_B} />
    </div>
  )
}
