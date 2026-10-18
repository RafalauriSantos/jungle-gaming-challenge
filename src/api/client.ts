import axios, { isAxiosError } from 'axios'
import { getToken, reportSessionLost, sessionSignal } from '@/session/store'
import type { ErrorBody } from './types'

export const api = axios.create({ baseURL: '/api', timeout: 10_000 })

// The first screen is drawn while the mock backend is still starting; requests wait for it here, at the transport,
// and nowhere else. With a real backend there is nothing to wait for.
let ready: Promise<unknown> = Promise.resolve()
export const holdRequestsUntil = (gate: Promise<unknown>) => {
  ready = gate
}
const transport = axios.getAdapter(api.defaults.adapter)
api.defaults.adapter = async (config) => {
  await ready
  return transport(config)
}

api.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) config.headers.set('Authorization', `Bearer ${token}`)
    // Tie every request to the session that made it, next to the caller's own signal (Query's).
    config.signal = config.signal ? AbortSignal.any([config.signal as AbortSignal, sessionSignal()]) : sessionSignal()
    return config
  },
  null,
  // Run at the moment of the call, not a tick later: a session change in between must not move the request to the new session.
  { synchronous: true },
)

api.interceptors.response.use(undefined, (error: unknown) => {
  const body = errorBodyOf(error)
  const sentToken = isAxiosError(error) ? String(error.config?.headers?.Authorization ?? '').replace(/^Bearer /, '') : ''
  // Only a refusal of the token that is still current counts; a late answer to an old session does not.
  if (sentToken && sentToken === getToken() && (body?.code === 'session_expired' || body?.code === 'unauthenticated')) {
    reportSessionLost(body.code)
  }
  return Promise.reject(error)
})

/** The API's error body, when the failure carries one. */
export const errorBodyOf = (error: unknown): ErrorBody | undefined =>
  isAxiosError(error) && error.response && typeof error.response.data === 'object' ? (error.response.data as ErrorBody) : undefined
