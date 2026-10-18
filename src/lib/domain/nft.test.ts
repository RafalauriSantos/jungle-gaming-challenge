import { describe, expect, it } from 'vitest'
import { formatRating } from './nft'

describe('formatRating', () => {
  it('UI-1#1: shows one decimal with a point, rounding half up', () => {
    expect(formatRating(4.8)).toBe('4.8')
    expect(formatRating(5)).toBe('5.0')
    expect(formatRating(3.85)).toBe('3.9')
    expect(formatRating(4.04)).toBe('4.0')
  })
})
