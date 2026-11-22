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

/**
 * Fetch the map of solved-problem tags for a handle.
 * Backend shape: { "dp": 721, "greedy": 961, ... }  (tag -> distinct problems solved)
 * Returns the object, or throws an Error with a friendly message.
 */
export async function getSolvedTags(handle) {
  try {
    const { data } = await client.get(`/solved-tags/${encodeURIComponent(handle)}`)
    if (!data || typeof data !== 'object') {
      throw new Error(`No tag data found for "${handle}".`)
    }
    return data
  } catch (err) {
    throw new Error(toFriendlyMessage(err, handle))
  }
}

/**
 * Fetch a handle's rating history (one entry per rated contest).
 * Backend shape: [ { contestId, contestName, rank, oldRating, newRating, ratingUpdateTimeSeconds }, ... ]
 */
export async function getRatingHistory(handle) {
  try {
    const { data } = await client.get(`/rating-history/${encodeURIComponent(handle)}`)
    return Array.isArray(data) ? data : []
  } catch (err) {
    throw new Error(toFriendlyMessage(err, handle))
  }
}

/**
 * Fetch a handle's solved-problem distribution by difficulty rating.
 * Backend shape: { "800": 12, "900": 20, ... }  (rating -> distinct problems solved)
 */
export async function getDifficultyDistribution(handle) {
  try {
    const { data } = await client.get(`/difficulty-distribution/${encodeURIComponent(handle)}`)
    return data && typeof data === 'object' ? data : {}
  } catch (err) {
    throw new Error(toFriendlyMessage(err, handle))
  }
}

/**
 * Autocomplete: handles (previously looked-up) starting with `query`.
 * Backend shape: [ { handle, rating, rank, titlePhoto, avatar }, ... ]
 * Best-effort: returns [] on any error or abort, never throws.
 * Pass an AbortSignal to cancel a superseded in-flight request.
 */
export async function getSuggestions(query, signal) {
  const q = (query || '').trim()
  if (!q) return []
  try {
    const { data } = await client.get('/handles/suggest', {
      params: { q, limit: 8 },
      signal,
    })
    return Array.isArray(data) ? data : []
  } catch {
    return []
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

/** Problem/user rating value → Codeforces difficulty-tier colour. */
export function difficultyColor(rating) {
  const r = Number(rating)
  if (!r || r < 1200) return '#9aa0a6' // newbie (gray)
  if (r < 1400) return '#19a319' // pupil (green)
  if (r < 1600) return '#03a89e' // specialist (cyan)
  if (r < 1900) return '#2f6fff' // expert (blue)
  if (r < 2100) return '#aa00aa' // candidate master (purple)
  if (r < 2400) return '#ff8c00' // master / IM (orange)
  return '#ff3333' // grandmaster and above (red)
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
