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
const NETWORK_NAMES = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' } as const
const TRAITS = ['Óculos', 'Esmeralda', 'Capuz', 'Fones', 'Chapéu', 'Dourado', 'Neon', 'Cósmico', 'Lenda', 'Aurora']
const CREATORS = ['Aria Voss', 'Kenji Mori', 'Luna Park', 'Theo Ruiz', 'Mina Okafor']
const BASE_DAY = Date.UTC(2026, 9, 1)

const SUPPLY = { '1/1': 1, '1/10': 10, '1/50': 50 } as const

/** Stock per tier varies with the index so filters and sold-out states have data. */
const stock = (i: number) => ({ '1/1': i % 5 === 0 ? 0 : 1, '1/10': (i * 3) % 11, '1/50': (i * 7) % 51 })

/** Deterministic: same list on every run so filters, pages and snapshots are stable. Collection and network vary independently, so combined filters narrow differently. */
export const NFT_FIXTURES: Nft[] = Array.from({ length: 48 }, (_, i) => {
  const id = `nft-${String(i + 1).padStart(3, '0')}`
  const number = ((i * 137) % 900) + 1
  const centi = ((i * 53) % 1200) + 2
  const editions: Edition[] = EDITION_TIERS.map((tier) => {
    const available = stock(i)[tier]
    return { id: `${id}:${tier.replace('/', '-')}`, tier, supply: SUPPLY[tier], available, status: available > 0 ? 'open' : 'sold_out' }
  })
  const name = `${NAMES[i % NAMES.length]} #${String(number).padStart(3, '0')}`
  const creator = CREATORS[i % CREATORS.length]!
  const network = NETWORKS[(i * 2 + Math.floor(i / 9)) % NETWORKS.length]!
  const rare = i % 6 === 0
  const series = `Kurio ${NAMES[i % NAMES.length]!.split(' ')[1]}s`
  const hex = (n: number) => (n % 0x10000).toString(16).toUpperCase().padStart(4, '0')
  return {
    id,
    number,
    tokenId: tokenIdOf(number),
    name,
    creator,
    collection: COLLECTIONS[i % COLLECTIONS.length]!,
    network,
    price: centiToEth(centi),
    previousPrice: i % 7 === 2 ? centiToEth(Number((BigInt(centi) * 115n) / 100n)) : undefined,
    image: `/nfts/art-${(i % 4) + 1}.webp`,
    rare,
    listedAt: new Date(BASE_DAY - i * 86_400_000).toISOString(),
    popularity: (i * 31) % 100,
    editions,
    series,
    about: `Um colecionável digital finalizado à mão da coleção ${series}, verificado na ${NETWORK_NAMES[network]}, com arte desbloqueável e acesso para colecionadores.`,
    attributes: [0, 1, 2].map((k) => TRAITS[(i + k * 3) % TRAITS.length]!).concat(rare ? ['Raro'] : []),
    rating: 3.8 + ((i * 7) % 13) / 10,
    reviewCount: 5 + ((i * 11) % 40),
    description: {
      paragraphs: [
        `${name} é uma obra digital finalizada à mão da coleção ${series}. Cada atributo fica armazenado nos metadados do token e verificado na ${NETWORK_NAMES[network]}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
        `A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. ${creator} recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.`,
      ],
      sections: [
        { label: 'Rede:', text: `Cunhado na ${NETWORK_NAMES[network]} com procedência imutável e metadados armazenados no IPFS.` },
        { label: 'Contrato:', text: `0x${hex(i * 2654 + 0x7a42)}...${hex(i * 4099 + 0x19e8)} • Contrato inteligente ERC-721 verificado.` },
        { label: 'Direitos autorais:', text: 'Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.' },
      ],
    },
    version: 1,
  }
})
