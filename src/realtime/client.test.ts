import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { nftDetailOptions, nftKeys, nftListOptions } from '@/api/nfts'
import { orderKeys, orderOptions } from '@/api/orders'
import type { Nft, NftListResponse, Order } from '@/api/types'
import { NFT_FIXTURES } from '@/mocks/fixtures/nfts'
import { clearSession, setSession } from '@/session/store'
import { connectRealtime } from './client'

const fake = vi.hoisted(() => {
  class FakeSocket {
    handlers = new Map<string, Set<unknown>>()
    options: { auth?: (cb: (data: { token: string | null }) => void) => void } = {}
    connects = 0
    disconnects = 0
    on(event: string, handler: unknown) {
      if (!this.handlers.has(event)) this.handlers.set(event, new Set())
      this.handlers.get(event)!.add(handler)
    }
    off(event: string) {
      this.handlers.delete(event)
    }
    connect() {
      this.connects++
    }
    disconnect() {
      this.disconnects++
    }
    get listeners() {
      return [...this.handlers.values()].reduce((n, s) => n + s.size, 0)
    }
  }
  return { FakeSocket, sockets: [] as InstanceType<typeof FakeSocket>[] }
})

vi.mock('socket.io-client', () => ({
  io: (_url: unknown, options: InstanceType<typeof fake.FakeSocket>['options']) => {
    const socket = new fake.FakeSocket()
    socket.options = options
    fake.sockets.push(socket)
    return socket
  },
}))

const auth = (id: string) => ({ user: { id, username: id, email: `${id}@kurio.test` }, session: { token: `tok_${id}`, expiresAt: '2030-01-01T00:00:00.000Z' } })

describe('the socket listeners live exactly as long as the app and are released with it', () => {
  it('RT-7#1: registers a fixed set once, reuses the socket for new sessions, and removes everything on cleanup', async () => {
    const stop = await connectRealtime(new QueryClient())
    const socket = fake.sockets[0]!
    expect([...socket.handlers.keys()].sort()).toEqual(['connect', 'nft.updated', 'order.updated'])
    expect(socket.listeners).toBe(3)

    // Signing in and out again and again reconnects the same socket; it never piles up handlers.
    for (const id of ['u_ana', 'u_bruno', 'u_ana']) {
      setSession(auth(id))
      clearSession()
    }
    expect(socket.listeners).toBe(3)
    expect(socket.connects).toBe(6)
    expect(fake.sockets).toHaveLength(1)

    stop()
    expect(socket.listeners).toBe(0)
    const disconnects = socket.disconnects
    setSession(auth('u_bruno')) // nothing is watching any more
    expect(socket.connects).toBe(6)
    expect(socket.disconnects).toBe(disconnects)
  })
})

// An answer that was read before an event, but arrives after it, is older than what the event already put in the cache.
describe('a late REST answer does not undo a newer event', () => {
  const deferred = <T,>() => {
    let resolve!: (value: T) => void
    const promise = new Promise<T>((r) => (resolve = r))
    return { promise, resolve }
  }
  const emit = (event: string, payload: unknown) => {
    for (const handler of fake.sockets.at(-1)!.handlers.get(event) ?? []) (handler as (p: unknown) => void)(payload)
  }
  const nft = (version: number, price: string): Nft => ({ ...NFT_FIXTURES[0]!, version, price })

  it('RT-4#3: a detail read before the event does not replace the newer price', async () => {
    const queryClient = new QueryClient()
    const stop = await connectRealtime(queryClient)
    queryClient.setQueryData(nftKeys.detail(NFT_FIXTURES[0]!.id), nft(1, '1'))
    const late = deferred<Nft>()
    const reading = queryClient.fetchQuery({ ...nftDetailOptions(NFT_FIXTURES[0]!.id), queryFn: () => late.promise, staleTime: 0 })

    emit('nft.updated', { data: nft(2, '2') })
    late.resolve(nft(1, '1'))
    await reading

    expect(queryClient.getQueryData<Nft>(nftKeys.detail(NFT_FIXTURES[0]!.id))).toMatchObject({ version: 2, price: '2' })
    stop()
  })

  it('RT-4#3: a list read before the event does not replace the newer price', async () => {
    const queryClient = new QueryClient()
    const stop = await connectRealtime(queryClient)
    const page = (n: Nft): NftListResponse => ({ items: [n], total: 1, page: 1, pageSize: 9 }) as NftListResponse
    const params = {}
    queryClient.setQueryData(nftKeys.list(params), page(nft(1, '1')))
    const late = deferred<NftListResponse>()
    const reading = queryClient.fetchQuery({ ...nftListOptions(params), queryFn: () => late.promise, staleTime: 0 })

    emit('nft.updated', { data: nft(2, '2') })
    late.resolve(page(nft(1, '1')))
    await reading

    expect(queryClient.getQueryData<NftListResponse>(nftKeys.list(params))!.items[0]).toMatchObject({ version: 2, price: '2' })
    stop()
  })

  it('ORD-10#4: an order read while pending does not undo a confirmation that arrived first', async () => {
    const queryClient = new QueryClient()
    const stop = await connectRealtime(queryClient)
    setSession(auth('u_ana'))
    const order = (status: Order['status'], version: number) => ({ id: 'ord_1', status, version }) as Order
    const key = orderKeys.one('u_ana', 'ord_1')
    queryClient.setQueryData(key, order('pending', 1))
    const late = deferred<Order>()
    const reading = queryClient.fetchQuery({ ...orderOptions('u_ana', 'ord_1'), queryFn: () => late.promise, staleTime: 0 })

    emit('order.updated', { scope: { userId: 'u_ana' }, version: 2, data: { id: 'ord_1', status: 'confirmed' } })
    late.resolve(order('pending', 1))
    await reading

    expect(queryClient.getQueryData<Order>(key)).toMatchObject({ status: 'confirmed', version: 2 })
    stop()
    clearSession()
  })
})
