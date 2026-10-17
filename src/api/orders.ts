import { queryOptions } from '@tanstack/react-query'
import { api } from './client'
import type { Order, Provider, WalletRef } from './types'

export const orderKeys = {
  one: (userId: string, id: string) => ['u', userId, 'orders', id] as const,
  pending: (userId: string) => ['u', userId, 'orders', 'pending'] as const,
}

export interface OrderBody {
  quoteId: string
  wallet: WalletRef
  provider: Provider
}

/** The same key with the same body always answers with the same order. */
export const createOrderRequest = (key: string, body: OrderBody) =>
  api.post<Order>('/orders', body, { headers: { 'Idempotency-Key': key } }).then((r) => ({ order: r.data, replayed: r.headers['idempotent-replayed'] === 'true' }))

export const connectWalletRequest = (provider: Provider) =>
  api.post<{ provider: Provider; status: 'connected' }>('/wallet-connections', { provider }).then((r) => r.data)

export const orderOptions = (userId: string, id: string, pollWhilePending = false) =>
  queryOptions({
    queryKey: orderKeys.one(userId, id),
    queryFn: ({ signal }) => api.get<Order>(`/orders/${encodeURIComponent(id)}`, { signal }).then((r) => r.data),
    // The socket is the fast path; polling covers a dropped connection. Terminal orders stop it.
    refetchInterval: (query) => (pollWhilePending && query.state.data?.status === 'pending' ? 3000 : false),
  })

export const pendingOrdersOptions = (userId: string) =>
  queryOptions({
    queryKey: orderKeys.pending(userId),
    queryFn: ({ signal }) => api.get<{ items: Order[] }>('/orders', { params: { status: 'pending' }, signal }).then((r) => r.data.items),
  })
