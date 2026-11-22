import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

function shortDate(seconds) {
  return new Date(seconds * 1000).toLocaleDateString(undefined, {
    year: '2-digit',
    month: 'short',
  })
}

function RatingTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const p = payload[0].payload
  const delta = p.newRating - p.oldRating
  return (
    <div className="rc-tooltip">
      <div className="rc-tooltip__name">{p.name}</div>
      <div className="rc-tooltip__row">
        Rating: <b>{p.rating}</b>{' '}
        <span style={{ color: delta >= 0 ? '#19a319' : '#ff6b6b' }}>
          ({delta >= 0 ? '+' : ''}
          {delta})
        </span>
      </div>
      <div className="rc-tooltip__row">Rank: #{p.rank.toLocaleString()}</div>
      <div className="rc-tooltip__date">{p.date}</div>
    </div>
  )
}

export default function RatingChart({ history }) {
  if (!history || history.length === 0) {
    return (
      <section className="chart-card">
        <h2 className="chart-card__title">Rating History</h2>
        <p className="chart-card__empty">This user hasn’t competed in any rated contests yet.</p>
      </section>
    )
  }

  const data = history.map((h, i) => ({
    idx: i + 1,
    rating: h.newRating,
    oldRating: h.oldRating,
    newRating: h.newRating,
    name: h.contestName,
    rank: h.rank,
    date: shortDate(h.ratingUpdateTimeSeconds),
  }))

  const ratings = data.map((d) => d.rating)
  const min = Math.min(...ratings)
  const max = Math.max(...ratings)
  const current = ratings[ratings.length - 1]

  return (
    <section className="chart-card">
      <div className="chart-card__header">
        <div>
          <h2 className="chart-card__title">Rating History</h2>
          <p className="chart-card__subtitle">{data.length} rated contests</p>
        </div>
        <div className="chart-card__badges">
          <span className="rc-badge">
            Peak <b>{max}</b>
          </span>
          <span className="rc-badge">
            Current <b>{current}</b>
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 8, right: 14, bottom: 4, left: -6 }}>
          <defs>
            <linearGradient id="ratingFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" vertical={false} />
          <XAxis
            dataKey="idx"
            tick={{ fill: '#9aa4b2', fontSize: 11 }}
            axisLine={{ stroke: '#2a313b' }}
            tickLine={false}
          />
          <YAxis
            domain={[Math.floor((min - 100) / 100) * 100, Math.ceil((max + 100) / 100) * 100]}
            tick={{ fill: '#9aa4b2', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={46}
          />
          <Tooltip content={<RatingTooltip />} />
          <Area
            type="monotone"
            dataKey="rating"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#ratingFill)"
            dot={false}
            activeDot={{ r: 4, fill: '#3b82f6' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </section>
  )
}
