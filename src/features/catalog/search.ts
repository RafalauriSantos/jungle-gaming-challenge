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
const pickDecimal = (v: unknown) => (typeof v === 'string' && /^\d+(\.\d+)?$/.test(v) ? v : undefined)

/** Normalizes untrusted URL params; defaults are dropped so URLs stay short. */
export function validateCatalogSearch(s: Record<string, unknown>): NftListParams {
  return {
    q: typeof s.q === 'string' && s.q.trim() ? s.q : undefined,
    collection: pickList(s.collection, COLLECTIONS),
    network: pickList(s.network, NETWORKS),
    minPrice: pickDecimal(s.minPrice),
    maxPrice: pickDecimal(s.maxPrice),
    feed: FEEDS.includes(s.feed as Feed) && s.feed !== 'all' ? (s.feed as Feed) : undefined,
    sort: SORTS.includes(s.sort as Sort) && s.sort !== 'recent' ? (s.sort as Sort) : undefined,
    page: Number(s.page) > 1 ? Math.floor(Number(s.page)) : undefined,
  }
}
