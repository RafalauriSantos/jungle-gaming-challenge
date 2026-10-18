import { parseEth } from '@/lib/eth'
import {
  COLLECTIONS,
  FEEDS,
  NETWORKS,
  SORTS,
  type Collection,
  type Feed,
  type Network,
  type NftListParams,
  type Sort,
} from '@/api/types'

export const COLLECTION_LABELS: Record<Collection, string> = {
  'digital-art': 'Arte digital',
  photography: 'Fotografia',
  music: 'Música',
  'art-3d': 'Arte 3D',
  collectibles: 'Colecionáveis',
  generative: 'Generativa',
  games: 'Jogos',
  memberships: 'Assinaturas',
  utility: 'Utilidade',
}

export const NETWORK_LABELS: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

export const SORT_LABELS: Record<Sort, string> = {
  recent: 'Listados recentemente',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
  name: 'Nome (A–Z)',
}

export const FEED_LABELS: Record<Feed, string> = {
  all: 'Todos os NFTs',
  new: 'Novos lançamentos',
  trending: 'Em alta',
}

const pickList = <T extends string>(value: unknown, allowed: readonly T[]) => {
  const items = (Array.isArray(value) ? value : []).filter((v): v is T => allowed.includes(v))
  return items.length ? items : undefined
}
// The router parses `?minPrice=1` into the number 1, so a typed price arrives as text or as a number. Either way
// it must be an ETH amount the money code accepts (digits, at most 18 decimals), or it is ignored.
const AMOUNT = /^\d+(\.\d{1,18})?$/
const pickDecimal = (v: unknown) => {
  const text = typeof v === 'number' && Number.isFinite(v) ? String(v) : v
  return typeof text === 'string' && AMOUNT.test(text) ? text : undefined
}
const pickRange = (min: unknown, max: unknown) => {
  const lo = pickDecimal(min)
  const hi = pickDecimal(max)
  return lo && hi && parseEth(lo) > parseEth(hi) ? { minPrice: undefined, maxPrice: undefined } : { minPrice: lo, maxPrice: hi }
}
const pickPage = (v: unknown) => (Number.isSafeInteger(Number(v)) && Number(v) > 1 ? Number(v) : undefined)

/** Normalizes untrusted URL params; defaults are dropped so URLs stay short. */
export function validateCatalogSearch(s: Record<string, unknown>): NftListParams {
  return {
    q: typeof s.q === 'string' && s.q.trim() ? s.q : undefined,
    collection: pickList(s.collection, COLLECTIONS),
    network: pickList(s.network, NETWORKS),
    ...pickRange(s.minPrice, s.maxPrice),
    feed: FEEDS.includes(s.feed as Feed) && s.feed !== 'all' ? (s.feed as Feed) : undefined,
    sort: SORTS.includes(s.sort as Sort) && s.sort !== 'recent' ? (s.sort as Sort) : undefined,
    page: pickPage(s.page),
  }
}
