import type { Nft } from '@/api/types'

export const totalAvailable = (nft: Nft) => nft.editions.reduce((sum, e) => sum + e.available, 0)

export const tokenIdOf = (number: number) => `#${String(number).padStart(4, '0')}`
