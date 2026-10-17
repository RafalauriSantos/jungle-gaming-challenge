import type { QueryClient } from '@tanstack/react-query'
import type { AuthResponse } from '@/api/types'
import { clearSession, setSession } from './store'

/** Starts a session and drops everything cached for whoever was here before. */
export function beginSession(queryClient: QueryClient, auth: AuthResponse) {
  setSession(auth) // aborts requests of the previous session
  void queryClient.cancelQueries()
  queryClient.clear()
}

export function endSession(queryClient: QueryClient) {
  clearSession()
  void queryClient.cancelQueries()
  queryClient.clear()
}
