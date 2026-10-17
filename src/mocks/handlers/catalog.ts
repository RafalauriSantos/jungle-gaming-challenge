import { delay, http, HttpResponse } from 'msw'
import {
  COLLECTIONS,
  FEEDS,
  NETWORKS,
  SORTS,
  type Collection,
  type Feed,
  type Network,
  type Nft,
  type NftListResponse,
  type Sort,
} from '@/api/types'
import { parseEth, weiToEth } from '@/lib/eth'
import { db } from '../db'

const PAGE_SIZE = 9
const NEW_COUNT = 12
const TRENDING_MIN = 70

const cmp = (a: bigint, b: bigint) => (a < b ? -1 : a > b ? 1 : 0)
const sorters: Record<Sort, (a: Nft, b: Nft) => number> = {
  recent: (a, b) => b.listedAt.localeCompare(a.listedAt),
  name: (a, b) => a.name.localeCompare(b.name),
  'price-asc': (a, b) => cmp(parseEth(a.price), parseEth(b.price)),
  'price-desc': (a, b) => cmp(parseEth(b.price), parseEth(a.price)),
}

const list = <T extends string>(raw: string | null, allowed: readonly T[]): T[] | null => {
  const items = raw ? raw.split(',').filter(Boolean) : []
  return items.every((i) => allowed.includes(i as T)) ? (items as T[]) : null
}
const isDecimal = (v: string | null) => v === null || /^\d+(\.\d+)?$/.test(v)

const validation = (message: string) =>
  HttpResponse.json({ code: 'validation', message }, { status: 422 })

export const catalogHandlers = [
  http.get('/api/nfts', async ({ request }) => {
    const p = new URL(request.url).searchParams
    const collections = list<Collection>(p.get('collection'), COLLECTIONS)
    const networks = list<Network>(p.get('network'), NETWORKS)
    const sort = (p.get('sort') ?? 'recent') as Sort
    const feed = (p.get('feed') ?? 'all') as Feed
    const min = p.get('minPrice')
    const max = p.get('maxPrice')

    if (!collections || !networks || !SORTS.includes(sort) || !FEEDS.includes(feed)) {
      return validation('Invalid query parameters')
    }
    if (!isDecimal(min) || !isDecimal(max)) return validation('Invalid price range')

    const page = Math.max(1, Number(p.get('page')) || 1)
    const q = p.get('q')?.trim().toLowerCase()
    const newestIds = new Set(
      [...db.state.nfts].sort(sorters.recent).slice(0, NEW_COUNT).map((n) => n.id),
    )

    await delay(150)
    const base = db.state.nfts
      .filter((n) => !q || n.name.toLowerCase().includes(q) || n.creator.toLowerCase().includes(q))
      .filter((n) => !min || parseEth(n.price) >= parseEth(min))
      .filter((n) => !max || parseEth(n.price) <= parseEth(max))
      .filter((n) => feed === 'all' || (feed === 'new' ? newestIds.has(n.id) : n.popularity >= TRENDING_MIN))

    const facets: NftListResponse['facets'] = {
      collection: Object.fromEntries(COLLECTIONS.map((c) => [c, 0])) as Record<Collection, number>,
      network: Object.fromEntries(NETWORKS.map((n) => [n, 0])) as Record<Network, number>,
    }
    for (const n of base) {
      facets.collection[n.collection]++
      facets.network[n.network]++
    }

    const filtered = base
      .filter((n) => !collections.length || collections.includes(n.collection))
      .filter((n) => !networks.length || networks.includes(n.network))
      .sort(sorters[sort])

    const prices = db.state.nfts.map((n) => parseEth(n.price))
    const body: NftListResponse = {
      items: filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      total: filtered.length,
      page,
      pageSize: PAGE_SIZE,
      facets,
      priceRange: {
        min: weiToEth(prices.reduce((a, b) => (a < b ? a : b))),
        max: weiToEth(prices.reduce((a, b) => (a > b ? a : b))),
      },
    }
    return HttpResponse.json(body)
  }),

  http.get('/api/nfts/:id', async ({ params }) => {
    await delay(100)
    const nft = db.state.nfts.find((n) => n.id === params.id)
    return nft
      ? HttpResponse.json(nft)
      : HttpResponse.json({ code: 'not_found', message: 'NFT not found' }, { status: 404 })
  }),
]
