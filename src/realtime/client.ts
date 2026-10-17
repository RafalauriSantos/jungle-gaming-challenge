import type { QueryClient } from '@tanstack/react-query'
import type { NftUpdated } from '@/api/events'
import { nftKeys } from '@/api/nfts'
import type { Nft, NftListResponse } from '@/api/types'

/** Version gate: an event only replaces state older than itself. */
const apply = (current: Nft, incoming: Nft) => (incoming.version > current.version ? incoming : current)

export async function connectRealtime(queryClient: QueryClient) {
  // Loaded on demand: socket.io-client keeps the `WebSocket` it finds at import time, so it
  // must be imported after the mock worker has patched it (see ARCHITECTURE.md §5).
  const { io } = await import('socket.io-client')
  // WebSocket only: long polling is plain HTTP and would bypass the mocked socket.
  const socket = io(import.meta.env.VITE_REALTIME_URL, { path: '/socket.io', transports: ['websocket'] })

  socket.on('nft.updated', ({ data }: NftUpdated) => {
    queryClient.setQueriesData<NftListResponse>({ queryKey: [...nftKeys.all, 'list'] }, (old) =>
      old && { ...old, items: old.items.map((n) => (n.id === data.id ? apply(n, data) : n)) },
    )
    queryClient.setQueryData<Nft>(nftKeys.detail(data.id), (old) => old && apply(old, data))
  })

  return () => {
    socket.off('nft.updated')
    socket.disconnect()
  }
}
