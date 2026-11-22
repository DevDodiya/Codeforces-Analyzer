import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'

function toSeries(history) {
  return (history || []).map((h) => ({
    t: h.ratingUpdateTimeSeconds * 1000,
    rating: h.newRating,
  }))
}

const year = (t) => new Date(t).getFullYear()

export default function CompareChart({ a, b, colorA, colorB }) {
  const da = toSeries(a.history)
  const db = toSeries(b.history)

  if (da.length === 0 && db.length === 0) {
    return (
      <section className="chart-card">
        <h2 className="chart-card__title">Rating Comparison</h2>
        <p className="chart-card__empty">Neither user has competed in rated contests.</p>
      </section>
    )
  }

  const all = [...da, ...db]
  const minT = Math.min(...all.map((p) => p.t))
  const maxT = Math.max(...all.map((p) => p.t))
  const ratings = all.map((p) => p.rating)
  const minR = Math.min(...ratings)
  const maxR = Math.max(...ratings)

  return (
    <section className="chart-card">
      <div className="chart-card__header">
        <div>
          <h2 className="chart-card__title">Rating Comparison</h2>
          <p className="chart-card__subtitle">
            {a.user.handle} vs {b.user.handle} over time
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart margin={{ top: 8, right: 16, bottom: 4, left: -6 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            domain={[minT, maxT]}
            tickFormatter={year}
            tick={{ fill: '#9aa4b2', fontSize: 11 }}
            axisLine={{ stroke: '#2a313b' }}
            tickLine={false}
            allowDuplicatedCategory={false}
          />
          <YAxis
            domain={[Math.floor((minR - 100) / 100) * 100, Math.ceil((maxR + 100) / 100) * 100]}
            tick={{ fill: '#9aa4b2', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={46}
          />
          <Tooltip
            contentStyle={{
              background: '#1e242c',
              border: '1px solid #2a313b',
              borderRadius: 8,
              color: '#e6e9ee',
            }}
            labelFormatter={(t) => new Date(t).toLocaleDateString()}
          />
          <Legend />
          <Line
            data={da}
            dataKey="rating"
            name={a.user.handle}
            stroke={colorA}
            strokeWidth={2}
            dot={false}
          />
          <Line
            data={db}
            dataKey="rating"
            name={b.user.handle}
            stroke={colorB}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </section>
  )
}
