import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import type { NftUpdated } from '@/api/events'

// The binding has no rooms or broadcast, so live connections are tracked here.
type Connection = { emit: (event: string, payload: unknown) => void }
const live = new Set<Connection>()

export const realtime = {
  connections: () => live.size,
  publish: (event: NftUpdated) => live.forEach((c) => c.emit(event.type, event)),
}

// The client connects to a dedicated origin so only Socket.IO traffic is intercepted (a catch-all
// pattern would also capture the dev server's HMR socket). The link matches the origin, not the path.
const socketLink = ws.link(import.meta.env.VITE_REALTIME_URL ?? 'wss://realtime.kurio.mock')

export const socketHandlers = [
  socketLink.addEventListener('connection', (connection) => {
    const io = toSocketIo(connection)
    const entry: Connection = { emit: (event, payload) => io.client.emit(event, payload) }
    live.add(entry)

    // Engine.IO v4 expects server pings and closes the client otherwise; the binding sends none.
    const ping = setInterval(() => connection.client.send('2'), 20_000)
    connection.client.addEventListener('close', () => {
      clearInterval(ping)
      live.delete(entry)
    })
  }),
]
