// The catalog: NFTs, editions, list parameters and the list page. The source of truth is ARCHITECTURE.md §2.

import type { Collection, Eth, Feed, Network, Sort } from './common'

// --- catalog

export const EDITION_TIERS = ['1/1', '1/10', '1/50'] as const
export type EditionTier = (typeof EDITION_TIERS)[number]

export interface Edition {
  /** `<nftId>:<tier with "-" for "/">`, safe in a URL path. */
  id: string
  tier: EditionTier
  supply: number
  available: number
  status: 'open' | 'sold_out'
}

export interface Nft {
  id: string
  /** The NFT's number, as in "Emerald Ape #042". */
  number: number
  /** `#` plus the number padded to 4 digits. One per NFT. */
  tokenId: string
  name: string
  creator: string
  collection: Collection
  network: Network
  price: Eth
  previousPrice?: Eth
  image: string
  rare: boolean
  listedAt: string
  popularity: number
  editions: Edition[]
  /** The line the NFT belongs to, as in "Kurio Apes"; not the catalog category. */
  series: string
  /** One-sentence summary shown beside the price. */
  about: string
  attributes: string[]
  /** Average of the collectors' ratings, from 1 to 5, and how many gave one. */
  rating: number
  reviewCount: number
  /** The long text under the tabs: two paragraphs and the labelled sections. */
  description: NftDescription
  /** Monotonic; bumped on every change, used by the version gate. */
  version: number
}

export interface NftDescription {
  paragraphs: string[]
  sections: { label: string; text: string }[]
}

export interface NftListParams {
  q?: string
  collection?: Collection[]
  network?: Network[]
  minPrice?: Eth
  maxPrice?: Eth
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
  priceRange: { min: Eth; max: Eth }
}
