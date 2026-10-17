import type { NftUpdated } from '@/api/events'
import type { Nft } from '@/api/types'
import { db } from './db'
import { realtime } from './socket'

/** What an evaluator or a test may do to the mock backend. Exposed as `window.__mock`. */
export const control = {
  connections: realtime.connections,

  updateNft(id: string, patch: Partial<Pick<Nft, 'price' | 'available'>>) {
    const nft = db.nfts.find((n) => n.id === id)
    if (!nft) throw new Error(`Unknown NFT ${id}`)
    Object.assign(nft, patch, { version: nft.version + 1 })
    const event: NftUpdated = {
      eventId: `nft.${id}.v${nft.version}`,
      type: 'nft.updated',
      resource: { type: 'nft', id },
      version: nft.version,
      occurredAt: new Date().toISOString(),
      scope: 'public',
      data: structuredClone(nft),
    }
    realtime.publish(event)
  },
}
