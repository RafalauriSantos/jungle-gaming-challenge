import { NFT_FIXTURES } from './fixtures/nfts'
import type { Nft } from '@/api/types'

const clone = <T,>(v: T): T => structuredClone(v)

/** In-memory state behind every handler; reset() restores the known scenario. */
export const db = {
  nfts: clone(NFT_FIXTURES) as Nft[],
  reset() {
    db.nfts = clone(NFT_FIXTURES)
  },
}
