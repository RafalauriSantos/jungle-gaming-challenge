import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import type { AppEvent } from '@/api/events'
import { db } from './db'
import { authenticate } from './services/auth'

// The binding has no rooms or broadcast, so live connections are tracked here, with the user each one
// authenticated as (taken from the Socket.IO CONNECT packet, which the binding does not decode).
interface Connection {
  userId: string | null
  emit: (event: string, payload: unknown) => void
  close: () => void
}
const live = new Set<Connection>()
/** The events sent to at least one connection, for tests and demos. */
const sent: AppEvent[] = []

export const realtime = {
  connections: () => live.size,
  sent: () => sent.map((e) => e.eventId),
  /** The event as it was sent, to deliver it again. */
  find: (eventId: string) => sent.find((e) => e.eventId === eventId),
  /** Closes every socket, as a network drop would. The client reconnects on its own. */
  dropAll: () => [...live].forEach((c) => c.close()),
  /** Public events go to everyone; an event for a user goes only to connections authenticated as that user. */
  publish(event: AppEvent) {
    for (const c of live) {
      if (event.scope === 'public' || c.userId === event.scope.userId) {
        c.emit(event.type, event)
        sent.push(event)
      }
    }
  },
}

// The client connects to a dedicated origin so only Socket.IO traffic is intercepted (a catch-all
// pattern would also capture the dev server's HMR socket). The link matches the origin, not the path.
const socketLink = ws.link(import.meta.env.VITE_REALTIME_URL ?? 'wss://realtime.kurio.mock')

/** The token in a Socket.IO CONNECT packet such as `40{"token":"tok_000001"}`. */
function tokenOf(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.startsWith('40{')) return null
  try {
    return (JSON.parse(raw.slice(2)) as { token?: string }).token ?? null
  } catch {
    return null
  }
}

export const socketHandlers = [
  socketLink.addEventListener('connection', (connection) => {
    const io = toSocketIo(connection)
    const entry: Connection = { userId: null, emit: (event, payload) => io.client.emit(event, payload), close: () => connection.client.close() }
    live.add(entry)

    connection.client.addEventListener('message', (event) => {
      const token = tokenOf(event.data)
      if (!token) return
      try {
        entry.userId = authenticate(db, token).id
      } catch {
        entry.userId = null // an unknown or expired token still gets the public events
      }
    })

    // Engine.IO v4 expects server pings and closes the client otherwise; the binding sends none.
    const ping = setInterval(() => connection.client.send('2'), 20_000)
    connection.client.addEventListener('close', () => {
      clearInterval(ping)
      live.delete(entry)
    })
  }),
]
