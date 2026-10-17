import { COLLECTIONS, EDITION_TIERS, NETWORKS, type Edition, type Nft } from '@/api/types'
import { centiToEth } from '@/lib/eth'
import { tokenIdOf } from '@/lib/nft'

const NAMES = [
  'Emerald Ape',
  'Sage Nomad',
  'Neon Vessel',
  'Cosmic Bloom',
  'Violet Nomad',
  'Ivory Baron',
  'Golden Beat',
  'Golden Signal',
]
const CREATORS = ['Aria Voss', 'Kenji Mori', 'Luna Park', 'Theo Ruiz', 'Mina Okafor']
const BASE_DAY = Date.UTC(2026, 9, 1)

const SUPPLY = { '1/1': 1, '1/10': 10, '1/50': 50 } as const

/** Stock per tier varies with the index so filters and sold-out states have data. */
const stock = (i: number) => ({ '1/1': i % 5 === 0 ? 0 : 1, '1/10': (i * 3) % 11, '1/50': (i * 7) % 51 })

/** Deterministic: same list on every run so filters, pages and snapshots are stable. */
export const NFT_FIXTURES: Nft[] = Array.from({ length: 48 }, (_, i) => {
  const id = `nft-${String(i + 1).padStart(3, '0')}`
  const number = ((i * 137) % 900) + 1
  const centi = ((i * 53) % 1200) + 2
  const editions: Edition[] = EDITION_TIERS.map((tier) => {
    const available = stock(i)[tier]
    return { id: `${id}:${tier.replace('/', '-')}`, tier, supply: SUPPLY[tier], available, status: available > 0 ? 'open' : 'sold_out' }
  })
  return {
    id,
    number,
    tokenId: tokenIdOf(number),
    name: `${NAMES[i % NAMES.length]} #${String(number).padStart(3, '0')}`,
    creator: CREATORS[i % CREATORS.length]!,
    collection: COLLECTIONS[i % COLLECTIONS.length]!,
    network: NETWORKS[Math.floor(i / 3) % NETWORKS.length]!,
    price: centiToEth(centi),
    previousPrice: i % 7 === 2 ? centiToEth(Number((BigInt(centi) * 115n) / 100n)) : undefined,
    image: `/nfts/art-${(i % 4) + 1}.webp`,
    rare: i % 6 === 0,
    listedAt: new Date(BASE_DAY - i * 86_400_000).toISOString(),
    popularity: (i * 31) % 100,
    editions,
    version: 1,
  }
})
