import { useSyncExternalStore } from 'react'
import type { AuthResponse, User } from '@/api/types'

// The session lives in memory and in local storage so a refresh restores it. Expiry is decided by the
// server; the client never trusts its own clock for it.
const KEY = 'kurio.session'

export type StoredSession = AuthResponse

let current: StoredSession | null = read()
let controller = new AbortController()
const listeners = new Set<() => void>()
let lostHandler: ((code: 'session_expired' | 'unauthenticated') => void) | undefined

function read(): StoredSession | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as StoredSession) : null
  } catch {
    return null
  }
}

function change(next: StoredSession | null) {
  current = next
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next))
    else localStorage.removeItem(KEY)
  } catch {
    // Storage may be unavailable; the in-memory session still works for this tab.
  }
  // Everything still in flight belongs to the previous session and must not land in the next one.
  controller.abort()
  controller = new AbortController()
  listeners.forEach((l) => l())
}

export const getSession = () => current
export const getToken = () => current?.session.token ?? null
/** Aborts when the session changes; every request is tied to it. */
export const sessionSignal = () => controller.signal
export const setSession = (next: StoredSession) => change(next)
export const clearSession = () => change(null)
/** The same session with fresher account data; requests in flight are not aborted. */
export function updateSessionUser(user: User) {
  if (!current) return
  current = { ...current, user }
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
    // Storage may be unavailable; the in-memory session still works for this tab.
  }
  listeners.forEach((l) => l())
}

/** Called by the HTTP layer when a request made with the current token is refused as expired or unknown. */
export const onSessionLost = (handler: typeof lostHandler) => {
  lostHandler = handler
}
export const reportSessionLost = (code: 'session_expired' | 'unauthenticated') => lostHandler?.(code)

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

/** Runs when the session starts, changes or ends. */
export const onSessionChange = (listener: () => void) => subscribe(listener)

export const useSession = (): StoredSession | null => useSyncExternalStore(subscribe, getSession, () => null)
export const useUser = (): User | null => useSession()?.user ?? null
