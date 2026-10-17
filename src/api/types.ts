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

export interface Nft {
  id: string
  name: string
  creator: string
  collection: Collection
  network: Network
  /** Decimal ETH string, e.g. "1.25". */
  price: string
  /** Struck-through price shown on discounted items. */
  previousPrice?: string
  /** Units still available across editions. */
  available: number
  editions: number
  image: string
  rare: boolean
  listedAt: string
  popularity: number
  /** Monotonic version, bumped on every change; used to ignore stale events. */
  version: number
}

export interface NftListParams {
  q?: string
  collection?: Collection[]
  network?: Network[]
  /** Decimal ETH strings. */
  minPrice?: string
  maxPrice?: string
  feed?: Feed
  sort?: Sort
  page?: number
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface NftListResponse extends Page<Nft> {
  facets: { collection: Record<Collection, number>; network: Record<Network, number> }
  priceRange: { min: string; max: string }
}

export interface ApiError {
  code: 'validation' | 'unauthorized' | 'forbidden' | 'not_found' | 'conflict' | 'transient'
  message: string
  fields?: Record<string, string>
}
