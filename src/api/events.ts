import type { Nft, Order } from './types'

/** Envelope shared by every real-time event; see ARCHITECTURE.md §5. */
export interface EventEnvelope<Type extends string, Resource extends string, Data> {
  /** Stable: the same state always carries the same id, so duplicates are recognizable. */
  eventId: string
  type: Type
  resource: { type: Resource; id: string }
  /** Monotonic per resource. */
  version: number
  occurredAt: string
  scope: 'public' | { userId: string }
  data: Data
}

export type NftUpdated = EventEnvelope<'nft.updated', 'nft', Nft>
export type OrderUpdated = EventEnvelope<'order.updated', 'order', { id: string; status: Order['status']; refusalReason?: Order['refusalReason'] }>

export type AppEvent = NftUpdated | OrderUpdated
