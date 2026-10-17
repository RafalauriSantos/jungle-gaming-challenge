import type { EditionTier } from '@/api/types'
import { db } from './db'
import { isScenario } from './scenarios'
import { nftEvent } from './events'
import { ctx } from './runtime'
import { realtime } from './socket'

/** What an evaluator or a test may do to the mock backend. Exposed as `window.__mock`. */
export const control = {
  connections: realtime.connections,
  generation: () => db.state.generation,
  /** How many orders the backend holds, whatever the UI shows. */
  orders: () => db.state.orders.length,
  sentEvents: realtime.sent,
  scenario: () => db.state.scenario,

  setScenario(name: string) {
    if (!isScenario(name)) throw new Error(`Unknown scenario ${name}`)
    db.state.scenario = name
    db.save()
  },

  /** Wipes the mock state and the app's own storage, then reloads from the home page. */
  reset() {
    window.location.assign('/?reset=1')
  },

  updateNft(id: string, patch: { price?: string; edition?: { tier: EditionTier; available: number } }) {
    const nft = db.state.nfts.find((n) => n.id === id)
    if (!nft) throw new Error(`Unknown NFT ${id}`)
    if (patch.price) nft.price = patch.price
    if (patch.edition) {
      const edition = nft.editions.find((e) => e.tier === patch.edition!.tier)!
      edition.available = patch.edition.available
      edition.status = edition.available > 0 ? 'open' : 'sold_out'
    }
    nft.version += 1
    db.save()
    ctx.publish(nftEvent(nft, db.now()))
  },
}
