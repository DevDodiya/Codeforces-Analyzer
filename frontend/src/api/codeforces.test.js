import { describe, it, expect } from 'vitest'
import { rankColor, difficultyColor } from './codeforces'

describe('rankColor', () => {
  it('maps known ranks to their tier colours', () => {
    expect(rankColor('legendary grandmaster')).toBe('#ff0000')
    expect(rankColor('grandmaster')).toBe('#ff3333')
    expect(rankColor('expert')).toBe('#2f6fff')
    expect(rankColor('pupil')).toBe('#19a319')
  })

  it('does not misclassify "candidate master" as "master"', () => {
    expect(rankColor('candidate master')).toBe('#aa00aa')
    expect(rankColor('candidate master')).not.toBe(rankColor('master'))
  })

  it('falls back to grey for missing ranks', () => {
    expect(rankColor(undefined)).toBe('#8a8a8a')
    expect(rankColor('')).toBe('#8a8a8a')
  })
})

describe('difficultyColor', () => {
  it('maps rating bands to tier colours', () => {
    expect(difficultyColor(800)).toBe('#9aa0a6')
    expect(difficultyColor(1300)).toBe('#19a319')
    expect(difficultyColor(1500)).toBe('#03a89e')
    expect(difficultyColor(1700)).toBe('#2f6fff')
    expect(difficultyColor(2000)).toBe('#aa00aa')
    expect(difficultyColor(2300)).toBe('#ff8c00')
    expect(difficultyColor(2600)).toBe('#ff3333')
  })

  it('treats zero / missing as the lowest tier', () => {
    expect(difficultyColor(0)).toBe('#9aa0a6')
    expect(difficultyColor(null)).toBe('#9aa0a6')
    expect(difficultyColor(undefined)).toBe('#9aa0a6')
  })
})
