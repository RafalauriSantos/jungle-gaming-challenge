import { COLLECTIONS, NETWORKS, type Nft } from '@/api/types'

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

/** Deterministic: same list on every run so filters, pages and snapshots are stable. */
export const NFT_FIXTURES: Nft[] = Array.from({ length: 48 }, (_, i) => {
  const price = (((i * 53) % 1200) / 100 + 0.02).toFixed(2)
  return {
    id: `nft-${String(i + 1).padStart(3, '0')}`,
    name: `${NAMES[i % NAMES.length]} #${String(((i * 137) % 900) + 1).padStart(3, '0')}`,
    creator: CREATORS[i % CREATORS.length]!,
    collection: COLLECTIONS[i % COLLECTIONS.length]!,
    network: NETWORKS[Math.floor(i / 3) % NETWORKS.length]!,
    price,
    previousPrice: i % 7 === 2 ? (Number(price) * 1.15).toFixed(2) : undefined,
    available: (i * 7) % 6,
    editions: 5,
    image: `/nfts/art-${(i % 4) + 1}.webp`,
    rare: i % 6 === 0,
    listedAt: new Date(BASE_DAY - i * 86_400_000).toISOString(),
    popularity: (i * 31) % 100,
    version: 1,
  }
})
