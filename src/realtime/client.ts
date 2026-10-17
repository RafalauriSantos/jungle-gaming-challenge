import type { QueryClient } from '@tanstack/react-query'
import type { NftUpdated, OrderUpdated } from '@/api/events'
import { nftKeys } from '@/api/nfts'
import { orderKeys } from '@/api/orders'
import type { Nft, NftListResponse, Order } from '@/api/types'
import { getSession, getToken, onSessionChange } from '@/session/store'
import { shouldApplyOrder, shouldApplyVersion } from './gate'

const onlyNewer = (current: Nft, incoming: Nft) => (shouldApplyVersion(current.version, incoming.version) ? incoming : current)

export async function connectRealtime(queryClient: QueryClient) {
  // Loaded on demand: socket.io-client keeps the `WebSocket` it finds at import time, so it
  // must be imported after the mock worker has patched it (see ARCHITECTURE.md §5).
  const { io } = await import('socket.io-client')
  // WebSocket only: long polling is plain HTTP and would bypass the mocked socket. The token is read
  // on every (re)connect, so the connection always speaks for the current session.
  const socket = io(import.meta.env.VITE_REALTIME_URL, {
    path: '/socket.io',
    transports: ['websocket'],
    auth: (cb) => cb({ token: getToken() }),
  })

  socket.on('nft.updated', ({ data }: NftUpdated) => {
    queryClient.setQueriesData<NftListResponse>({ queryKey: [...nftKeys.all, 'list'] }, (old) =>
      old && { ...old, items: old.items.map((n) => (n.id === data.id ? onlyNewer(n, data) : n)) },
    )
    queryClient.setQueryData<Nft>(nftKeys.detail(data.id), (old) => old && onlyNewer(old, data))
    // Prices and stock feed the cart totals: ask for a fresh quote and cart of this user.
    const user = getSession()?.user
    if (user) {
      void queryClient.invalidateQueries({ queryKey: ['u', user.id, 'quote'] })
      void queryClient.invalidateQueries({ queryKey: ['u', user.id, 'cart'] })
    }
  })

  socket.on('order.updated', (event: OrderUpdated) => {
    const user = getSession()?.user
    // Private events are for one user; anything else is dropped.
    if (!user || event.scope === 'public' || event.scope.userId !== user.id) return
    const { id, status, refusalReason } = event.data
    const key = orderKeys.one(user.id, id)
    queryClient.setQueryData<Order>(key, (old) => (old && shouldApplyOrder(old, { status, version: event.version }) ? { ...old, status, version: event.version, refusalReason } : old))
    // The event carries the status; the receipt and the settled cart come from the API.
    void queryClient.invalidateQueries({ queryKey: key })
    void queryClient.invalidateQueries({ queryKey: orderKeys.pending(user.id) })
    void queryClient.invalidateQueries({ queryKey: ['u', user.id, 'cart'] })
  })

  // A new session means a new identity for the socket.
  const stopWatching = onSessionChange(() => {
    socket.disconnect()
    socket.connect()
  })

  return () => {
    stopWatching()
    socket.off('nft.updated')
    socket.off('order.updated')
    socket.disconnect()
  }
}
