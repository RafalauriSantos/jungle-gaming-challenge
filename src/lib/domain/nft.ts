import type { Nft } from '@/api/types'

export const totalAvailable = (nft: Nft) => nft.editions.reduce((sum, e) => sum + e.available, 0)

export const tokenIdOf = (number: number) => `#${String(number).padStart(4, '0')}`

/** "4.8": one decimal, a point. Done with integers so no number-to-text rounding of the platform is involved. */
export function formatRating(rating: number): string {
  const tenths = Math.round(rating * 10)
  return `${Math.floor(tenths / 10)}.${tenths % 10}`
}
