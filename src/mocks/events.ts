import type { NftUpdated, OrderUpdated } from '@/api/events'
import type { Nft } from '@/api/types'
import type { StoredOrder } from './db'

// Ids are stable: the same state always has the same event id, so a duplicate is recognizable.
export const nftEvent = (nft: Nft, occurredAt: number): NftUpdated => ({
  eventId: `nft.${nft.id}.v${nft.version}`,
  type: 'nft.updated',
  resource: { type: 'nft', id: nft.id },
  version: nft.version,
  occurredAt: new Date(occurredAt).toISOString(),
  scope: 'public',
  data: structuredClone(nft),
})

export const orderEvent = (order: StoredOrder, occurredAt: number): OrderUpdated => ({
  eventId: `order.${order.id}.v${order.version}`,
  type: 'order.updated',
  resource: { type: 'order', id: order.id },
  version: order.version,
  occurredAt: new Date(occurredAt).toISOString(),
  scope: { userId: order.userId },
  data: { id: order.id, status: order.status, ...(order.refusalReason && { refusalReason: order.refusalReason }) },
})
