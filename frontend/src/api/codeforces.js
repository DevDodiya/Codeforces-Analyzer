import axios from 'axios'

// Base URL of the Quarkus backend. Override via frontend/.env (VITE_API_BASE_URL).
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
})

/**
 * Fetch a Codeforces user's profile.
 * Backend shape: { result: [ { ...user } ], status: "OK" }
 * Returns the single user object, or throws an Error with a friendly message.
 */
export async function getUserInfo(handle) {
  try {
    const { data } = await client.get(`/user-info/${encodeURIComponent(handle)}`)
    const user = data?.result?.[0]
    if (!user) {
      throw new Error(`No profile data found for "${handle}".`)
    }
    return user
  } catch (err) {
    throw new Error(toFriendlyMessage(err, handle))
  }
}

/** Converts an axios error into a human-readable message. */
function toFriendlyMessage(err, handle) {
  // Backend returns { status: "error", message: "..." } for 4xx responses.
  const apiMessage = err?.response?.data?.message
  if (apiMessage) return apiMessage

  if (err?.code === 'ECONNABORTED') {
    return 'The request timed out. Please try again.'
  }
  if (err?.message === 'Network Error') {
    return 'Could not reach the backend. Is the server running on ' + BASE_URL + '?'
  }
  return err?.message || 'Something went wrong. Please try again.'
}

/** Codeforces rank → colour, matching the official rating-tier palette. */
export function rankColor(rank) {
  if (!rank) return '#8a8a8a'
  const r = rank.toLowerCase()
  if (r.includes('legendary grandmaster')) return '#ff0000'
  if (r.includes('international grandmaster')) return '#ff1e1e'
  if (r.includes('grandmaster')) return '#ff3333'
  if (r.includes('international master')) return '#ff8c00'
  if (r.includes('candidate master')) return '#aa00aa'
  if (r.includes('master')) return '#ff8c00'
  if (r.includes('expert')) return '#2f6fff'
  if (r.includes('specialist')) return '#03a89e'
  if (r.includes('pupil')) return '#19a319'
  if (r.includes('newbie')) return '#9aa0a6'
  return '#8a8a8a'
}
