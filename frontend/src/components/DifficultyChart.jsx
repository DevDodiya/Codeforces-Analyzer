import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts'
import { difficultyColor } from '../api/codeforces'

function DifficultyTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const p = payload[0].payload
  return (
    <div className="rc-tooltip">
      <div className="rc-tooltip__name" style={{ color: difficultyColor(p.rating) }}>
        Difficulty {p.rating}
      </div>
      <div className="rc-tooltip__row">
        <b>{p.count}</b> solved
      </div>
    </div>
  )
}

export default function DifficultyChart({ distribution }) {
  const data = Object.entries(distribution)
    .map(([rating, count]) => ({ rating: Number(rating), count }))
    .filter((d) => d.rating > 0)
    .sort((a, b) => a.rating - b.rating)

  if (data.length === 0) {
    return (
      <section className="chart-card">
        <h2 className="chart-card__title">Problems by Difficulty</h2>
        <p className="chart-card__empty">No rated problems solved yet.</p>
      </section>
    )
  }

  const total = data.reduce((s, d) => s + d.count, 0)
  const hardest = data[data.length - 1].rating

  return (
    <section className="chart-card">
      <div className="chart-card__header">
        <div>
          <h2 className="chart-card__title">Problems by Difficulty</h2>
          <p className="chart-card__subtitle">
            {total.toLocaleString()} rated problems · hardest solved {hardest}
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 8, right: 10, bottom: 4, left: -14 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" vertical={false} />
          <XAxis
            dataKey="rating"
            tick={{ fill: '#9aa4b2', fontSize: 11 }}
            axisLine={{ stroke: '#2a313b' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#9aa4b2', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={<DifficultyTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.map((d) => (
              <Cell key={d.rating} fill={difficultyColor(d.rating)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </section>
  )
}
