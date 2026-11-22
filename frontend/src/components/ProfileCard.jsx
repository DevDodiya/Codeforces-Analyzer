import { MapPin, Building2, Trophy, TrendingUp, Users, Calendar } from 'lucide-react'
import { rankColor } from '../api/codeforces'

function formatDate(seconds) {
  if (!seconds) return '—'
  return new Date(seconds * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function timeAgo(seconds) {
  if (!seconds) return '—'
  const days = Math.floor((Date.now() - seconds * 1000) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  const years = Math.floor(days / 365)
  return `${years} year${years > 1 ? 's' : ''} ago`
}

export default function ProfileCard({ user }) {
  const color = rankColor(user.rank)
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')
  const location = [user.city, user.country].filter(Boolean).join(', ')

  return (
    <section className="profile-card">
      <div className="profile-card__top">
        <img
          className="profile-card__avatar"
          src={user.avatar || user.titlePhoto}
          alt={`${user.handle}'s avatar`}
          style={{ borderColor: color }}
          referrerPolicy="no-referrer"
          onError={(e) => {
            if (user.titlePhoto && e.currentTarget.src !== user.titlePhoto) {
              e.currentTarget.src = user.titlePhoto
            }
          }}
        />
        <div className="profile-card__identity">
          <a
            className="profile-card__handle"
            href={`https://codeforces.com/profile/${user.handle}`}
            target="_blank"
            rel="noreferrer"
            style={{ color }}
          >
            {user.handle}
          </a>
          {user.rank && (
            <span className="profile-card__rank" style={{ color }}>
              {user.rank}
            </span>
          )}
          {fullName && <span className="profile-card__name">{fullName}</span>}
        </div>
      </div>

      <div className="profile-card__ratings">
        <div className="rating-box">
          <span className="rating-box__label">Rating</span>
          <span className="rating-box__value" style={{ color }}>
            {user.rating ?? 'Unrated'}
          </span>
        </div>
        <div className="rating-box">
          <span className="rating-box__label">Max Rating</span>
          <span className="rating-box__value">{user.maxRating ?? '—'}</span>
          {user.maxRank && <span className="rating-box__sub">{user.maxRank}</span>}
        </div>
      </div>

      <ul className="profile-card__meta">
        {location && (
          <li>
            <MapPin size={16} /> {location}
          </li>
        )}
        {user.organization && (
          <li>
            <Building2 size={16} /> {user.organization}
          </li>
        )}
        <li>
          <TrendingUp size={16} /> Contribution: {user.contribution ?? 0}
        </li>
        <li>
          <Users size={16} /> {(user.friendOfCount ?? 0).toLocaleString()} friends
        </li>
        <li>
          <Calendar size={16} /> Registered {formatDate(user.registrationTimeSeconds)}
        </li>
        <li>
          <Trophy size={16} /> Last online {timeAgo(user.lastOnlineTimeSeconds)}
        </li>
      </ul>
    </section>
  )
}
