import axios, { AxiosError, isAxiosError } from 'axios'
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

// A request that reaches the host instead of the mock (the service worker not in control of the page) comes back as the
// app's own index.html with a 200. That is not data: failing it here shows the retry state of the screen instead of
// feeding a string to code that expects a cart or an NFT.
//
// The mock service worker can lose track of the page: a browser ends an idle worker and starts it again empty. The page
// may register a way to wake it (`onUnservedRequest`); the request is then sent once more before it counts as failed.
let wakeWorker: (() => Promise<void>) | undefined
export const onUnservedRequest = (wake: () => Promise<void>) => {
  wakeWorker = wake
}

api.interceptors.response.use(async (response) => {
  if (!String(response.headers['content-type'] ?? '').includes('text/html')) return response
  const config = response.config as typeof response.config & { retriedAfterWake?: boolean }
  if (wakeWorker && !config.retriedAfterWake) {
    await wakeWorker()
    return api.request({ ...config, retriedAfterWake: true } as typeof config)
  }
  throw new AxiosError('The server answered with a page instead of data.', AxiosError.ERR_BAD_RESPONSE, response.config, response.request, response)
})

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
