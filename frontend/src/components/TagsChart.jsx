import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const COLORS = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#14b8a6', '#6366f1', '#84cc16', '#f97316', '#a855f7',
]

const truncate = (s) => (s.length > 15 ? s.slice(0, 14) + '…' : s)

export default function TagsChart({ tags, topN = 12 }) {
  const data = Object.entries(tags)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)

  if (data.length === 0) {
    return (
      <section className="chart-card">
        <h2 className="chart-card__title">Top Problem Tags</h2>
        <p className="chart-card__empty">No solved problems with tags yet.</p>
      </section>
    )
  }

  const height = Math.max(260, data.length * 34 + 20)

  return (
    <section className="chart-card">
      <h2 className="chart-card__title">Top Problem Tags</h2>
      <p className="chart-card__subtitle">
        Distinct problems solved per tag (top {data.length})
      </p>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 20, bottom: 4, left: 4 }}
        >
          <XAxis
            type="number"
            tick={{ fill: '#9aa4b2', fontSize: 12 }}
            axisLine={{ stroke: '#2a313b' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="tag"
            width={118}
            tickFormatter={truncate}
            tick={{ fill: '#e6e9ee', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            contentStyle={{
              background: '#1e242c',
              border: '1px solid #2a313b',
              borderRadius: 8,
              color: '#e6e9ee',
            }}
            labelStyle={{ color: '#e6e9ee', fontWeight: 600 }}
            itemStyle={{ color: '#e6e9ee' }}
            formatter={(value) => [value, 'solved']}
          />
          <Bar dataKey="count" radius={[0, 5, 5, 0]} maxBarSize={26}>
            {data.map((entry, i) => (
              <Cell key={entry.tag} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </section>
  )
}
