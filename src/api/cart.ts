import { queryOptions } from '@tanstack/react-query'
import { api } from './client'
import type { Cart, Quote, SkippedLine } from './types'

/** Private query keys start with the user id, so one user's cache never answers for another. */
export const cartKeys = {
  cart: (userId: string) => ['u', userId, 'cart'] as const,
  quote: (userId: string, cartVersion: number, coupon: string) => ['u', userId, 'quote', cartVersion, coupon] as const,
}

export const cartOptions = (userId: string) =>
  queryOptions({ queryKey: cartKeys.cart(userId), queryFn: ({ signal }) => api.get<Cart>('/cart', { signal }).then((r) => r.data) })

export const addItemRequest = (input: { nftId: string; editionId: string; quantity: number }) =>
  api.post<Cart>('/cart/items', input).then((r) => r.data)

const itemPath = (nftId: string, editionId: string) => `/cart/items/${encodeURIComponent(nftId)}/${encodeURIComponent(editionId)}`

export const setQuantityRequest = (nftId: string, editionId: string, quantity: number) =>
  api.put<Cart>(itemPath(nftId, editionId), { quantity }).then((r) => r.data)

export const removeItemRequest = (nftId: string, editionId: string) => api.delete<Cart>(itemPath(nftId, editionId)).then((r) => r.data)

/** Pricing the cart is a computation on the server, so it is read like a query. */
export const quoteOptions = (userId: string, cartVersion: number, coupon: string) =>
  queryOptions({
    queryKey: cartKeys.quote(userId, cartVersion, coupon),
    queryFn: ({ signal }) => api.post<Quote>('/quotes', coupon ? { couponCode: coupon } : {}, { signal }).then((r) => r.data),
    // Pricing a cart is cheap and a coupon can change its meaning, so each use asks again.
    gcTime: 60_000,
    // While a new version is priced, the previous numbers stay on screen, marked as updating.
    placeholderData: (previous) => previous,
  })

export const mergeCartRequest = (input: { mergeId: string; items: { nftId: string; editionId: string; quantity: number }[] }) =>
  api.post<{ cart: Cart; skipped: SkippedLine[] }>('/cart/merge', input).then((r) => r.data)
