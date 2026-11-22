import { FileText, ExternalLink } from 'lucide-react'

// Codeforces blog titles come wrapped in HTML (e.g. "<p>Title</p>"); strip it to plain text.
function cleanTitle(raw) {
  if (!raw) return ''
  const txt = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const el = typeof document !== 'undefined' ? document.createElement('textarea') : null
  if (el) {
    el.innerHTML = txt
    return el.value
  }
  return txt
}

function blogDate(seconds) {
  if (!seconds) return ''
  return new Date(seconds * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function BlogsSection({ blogs, limit = 8 }) {
  const items = [...blogs]
    .map((b) => ({ ...b, title: cleanTitle(b.title) }))
    .filter((b) => b.title)
    .sort((a, b) => (b.creationTimeSeconds || 0) - (a.creationTimeSeconds || 0))
    .slice(0, limit)

  if (items.length === 0) return null

  return (
    <section className="chart-card">
      <div className="chart-card__header">
        <div>
          <h2 className="chart-card__title">Recent Blog Entries</h2>
          <p className="chart-card__subtitle">
            {blogs.length} total · showing latest {items.length}
          </p>
        </div>
      </div>
      <ul className="blog-list">
        {items.map((b) => (
          <li key={b.id} className="blog-item">
            <a
              className="blog-item__link"
              href={`https://codeforces.com/blog/entry/${b.id}`}
              target="_blank"
              rel="noreferrer"
            >
              <FileText size={16} className="blog-item__icon" />
              <span className="blog-item__title">{b.title}</span>
              <ExternalLink size={14} className="blog-item__ext" />
            </a>
            <div className="blog-item__meta">
              {b.creationTimeSeconds ? <span>{blogDate(b.creationTimeSeconds)}</span> : null}
              {typeof b.rating === 'number' ? (
                <span className="blog-item__rating">▲ {b.rating}</span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
