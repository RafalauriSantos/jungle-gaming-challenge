// Vocabulary shared by every contract: the closed lists the API uses and the ETH amount type. The source of truth is ARCHITECTURE.md §2.

export const COLLECTIONS = [
  'digital-art',
  'photography',
  'music',
  'art-3d',
  'collectibles',
  'generative',
  'games',
  'memberships',
  'utility',
] as const
export type Collection = (typeof COLLECTIONS)[number]

export const NETWORKS = ['ethereum', 'polygon', 'solana'] as const
export type Network = (typeof NETWORKS)[number]

export const SORTS = ['recent', 'price-asc', 'price-desc', 'name'] as const
export type Sort = (typeof SORTS)[number]

export const FEEDS = ['all', 'new', 'trending'] as const
export type Feed = (typeof FEEDS)[number]

export const PROVIDERS = ['metamask', 'walletconnect', 'coinbase'] as const
export type Provider = (typeof PROVIDERS)[number]

/** Amounts of ETH are decimal strings, see `src/lib/domain/eth.ts`. */
export type Eth = string
