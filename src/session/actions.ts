import type { QueryClient } from '@tanstack/react-query'
import type { AuthResponse } from '@/api/types'
import { clearSession, getSession, setSession } from './store'

/** Starts a session and drops everything cached for whoever was here before. */
export function beginSession(queryClient: QueryClient, auth: AuthResponse) {
  setSession(auth) // aborts requests of the previous session
  void queryClient.cancelQueries()
  queryClient.clear()
}

/** Removes what this browser stored for one user (`kurio.<userId>.*`), in both storages. */
function forgetUser(userId: string) {
  for (const storage of [localStorage, sessionStorage]) {
    Object.keys(storage)
      .filter((k) => k.startsWith(`kurio.${userId}.`))
      .forEach((k) => storage.removeItem(k))
  }
}

/**
 * Ends the session. `forget` (a logout) also wipes the user's stored data; an expired session keeps it,
 * so the user can pick up where they were after signing in again.
 */
export function endSession(queryClient: QueryClient, { forget = false } = {}) {
  const userId = getSession()?.user.id
  clearSession()
  void queryClient.cancelQueries()
  queryClient.clear()
  if (forget && userId) forgetUser(userId)
}
