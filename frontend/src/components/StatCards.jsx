import { Layers, Sigma, Award, Divide } from 'lucide-react'

export default function StatCards({ tags }) {
  const entries = Object.entries(tags)
  const tagCount = entries.length
  const totalSolves = entries.reduce((sum, [, v]) => sum + v, 0)
  const [topTag, topCount] = entries.reduce(
    (max, cur) => (cur[1] > max[1] ? cur : max),
    ['—', 0],
  )
  const avgPerTag = tagCount ? Math.round(totalSolves / tagCount) : 0

  const cards = [
    { icon: Layers, label: 'Tags Practiced', value: tagCount },
    { icon: Sigma, label: 'Total Tag Solves', value: totalSolves.toLocaleString(), sub: 'across all tags' },
    { icon: Award, label: 'Top Tag', value: topTag, sub: `${topCount} problems` },
    { icon: Divide, label: 'Avg / Tag', value: avgPerTag },
  ]

  return (
    <div className="stat-cards">
      {cards.map(({ icon: Icon, label, value, sub }) => (
        <div className="stat-card" key={label}>
          <span className="stat-card__icon">
            <Icon size={18} />
          </span>
          <span className="stat-card__value" title={String(value)}>
            {value}
          </span>
          <span className="stat-card__label">{label}</span>
          {sub && <span className="stat-card__sub">{sub}</span>}
        </div>
      ))}
    </div>
  )
}
