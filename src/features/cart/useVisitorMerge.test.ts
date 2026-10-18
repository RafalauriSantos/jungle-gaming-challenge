import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { cartKeys } from '@/api/cart'
import type { Cart } from '@/api/types'
import { claimVisitorMerge } from './useVisitorMerge'

const merged = { items: [{ nftId: 'nft-004' }] } as unknown as Cart
const empty = { items: [] } as unknown as Cart

vi.mock('./visitorCart', () => ({ claimVisitorCart: () => ({ mergeId: 'm1', items: [] }), finishVisitorMerge: () => undefined }))
vi.mock('@/api/cart', async (original) => ({ ...(await original<typeof import('@/api/cart')>()), mergeCartRequest: async () => ({ cart: merged, skipped: [] }) }))

describe('the visitor cart merge', () => {
  it('CART-3#1: a cart read that started before the merge and ends after it does not wipe the merged cart', async () => {
    const queryClient = new QueryClient()
    const key = cartKeys.cart('u_ana')
    let finishOldRead!: (cart: Cart) => void
    // The page asked for the cart as soon as the session began: the answer (empty) is still on its way.
    queryClient.fetchQuery({ queryKey: key, queryFn: () => new Promise<Cart>((resolve) => (finishOldRead = resolve)) }).catch(() => undefined) // cancelled by the merge

    await claimVisitorMerge(queryClient, 'u_ana')
    finishOldRead(empty)
    await new Promise((r) => setTimeout(r, 0))

    expect(queryClient.getQueryData<Cart>(key)).toBe(merged)
  })
})
