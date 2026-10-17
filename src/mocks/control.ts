import type { EditionTier } from '@/api/types'
import { db } from './db'
import { isScenario } from './scenarios'
import type { AppEvent } from '@/api/events'
import { NFT_FIXTURES } from './fixtures/nfts'
import { nftEvent, orderEvent } from './events'
import { appliedLatencies } from './network'
import { ctx } from './runtime'
import { settleDue } from './services/orders'
import { realtime } from './socket'

/** What an evaluator or a test may do to the mock backend. Exposed as `window.__mock`. */
export const control = {
  connections: realtime.connections,
  generation: () => db.state.generation,
  /** The delays the network scenarios have applied so far, in order. */
  latencies: appliedLatencies,

  /** Applies every order transition that has come due, as a read would. */
  settle: () => settleDue(ctx),

  /** Drops every socket, as a lost connection would; the app reconnects by itself. */
  dropConnections: realtime.dropAll,

  /** Delivers an event again through the socket: a duplicate. */
  resend(eventId: string) {
    const event = realtime.find(eventId)
    if (!event) throw new Error(`No event ${eventId} was sent`)
    realtime.publish(event)
  },

  /** Delivers the original catalog snapshot of an NFT (version 1): an old event after newer ones. */
  emitOldNft(nftId: string) {
    const original = NFT_FIXTURES.find((n) => n.id === nftId)!
    realtime.publish(nftEvent(structuredClone(original), db.now()))
  },

  /** Delivers an order event with a chosen status and version, to the order's owner. */
  emitOrder(orderId: string, status: 'pending' | 'confirmed' | 'refused', version: number) {
    const order = db.state.orders.find((o) => o.id === orderId)!
    realtime.publish(orderEvent({ ...order, status, version }, db.now()))
  },

  publish: (event: AppEvent) => realtime.publish(event),

  /** How many orders the backend holds, whatever the UI shows. */
  orders: () => db.state.orders.length,
  sentEvents: realtime.sent,
  scenario: () => db.state.scenario,

  /** How long the next orders stay pending. Use a long delay to hold an order, then `advance` to settle it. */
  setSettleDelay(ms: number) {
    db.state.settleAfterMs = ms
    db.save()
  },

  advance(ms: number) {
    db.advance(ms)
  },

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
