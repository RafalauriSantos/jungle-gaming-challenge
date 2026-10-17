import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { clearSession, setSession } from '@/session/store'
import { connectRealtime } from './client'

const fake = vi.hoisted(() => {
  class FakeSocket {
    handlers = new Map<string, Set<unknown>>()
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
  io: () => {
    const socket = new fake.FakeSocket()
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
