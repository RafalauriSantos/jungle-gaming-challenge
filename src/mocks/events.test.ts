import { describe, expect, it } from 'vitest'
import type { Nft } from '@/api/types'
import type { StoredOrder } from './db'
import { nftEvent, orderEvent } from './events'

const nft = { id: 'nft-004', version: 3 } as Nft
const order = { id: 'ord_000001', userId: 'u_ana', status: 'confirmed', version: 2 } as StoredOrder

describe('RT-3#1: events carry a stable id, the resource and a version', () => {
  it('RT-3#1: describes an NFT change for everyone', () => {
    const event = nftEvent(nft, Date.UTC(2026, 9, 17))
    expect(event).toMatchObject({ eventId: 'nft.nft-004.v3', type: 'nft.updated', resource: { type: 'nft', id: 'nft-004' }, version: 3, scope: 'public' })
    expect(event.occurredAt).toBe('2026-10-17T00:00:00.000Z')
    expect(nftEvent(nft, 0).eventId).toBe(event.eventId) // the same state is the same event, so a duplicate is recognizable
  })

  it('describes an order change for its owner only', () => {
    expect(orderEvent(order, 0)).toMatchObject({ eventId: 'order.ord_000001.v2', type: 'order.updated', resource: { type: 'order', id: 'ord_000001' }, version: 2, scope: { userId: 'u_ana' }, data: { id: 'ord_000001', status: 'confirmed' } })
  })
})
