import { QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { holdRequestsUntil, onUnservedRequest } from './api/client'
import { createQueryClient } from './api/query-client'
import { RouteError } from './components/layout/RouteError'
import './index.css'
import { connectRealtime } from './realtime/client'
import { parseSearch } from './lib/domain/search-params'
import { routeTree } from './routeTree.gen'
import { endSession } from './session/actions'
import { onSessionLost } from './session/store'

const queryClient = createQueryClient()
const router = createRouter({ routeTree, parseSearch, defaultErrorComponent: RouteError })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

/**
 * The worker answers only the pages it has been told to serve, and that list lives in its memory. A browser ends an idle
 * worker (a tab left in the background, timers throttled) and starts it again empty: from then on it lets every request
 * through to the host. Telling it again that this page is to be served is what MSW itself does at start.
 */
async function wakeWorker() {
  const worker = navigator.serviceWorker.controller
  if (!worker) return
  await new Promise<void>((resolve) => {
    const done = (event: MessageEvent) => {
      if (event.data?.type === 'MOCKING_ENABLED') {
        navigator.serviceWorker.removeEventListener('message', done)
        resolve()
      }
    }
    navigator.serviceWorker.addEventListener('message', done)
    worker.postMessage('MOCK_ACTIVATE')
    window.setTimeout(resolve, 1000)
  })
}

/**
 * After a hard reload, or in some returns through the history, the page is not controlled by the worker even though it is
 * running: its requests would go to the host. Wait for the worker to take over; if it does not, load the page once more.
 */
async function controlledByWorker() {
  if (navigator.serviceWorker.controller) {
    sessionStorage.removeItem('kurio.sw-reload')
    return
  }
  await new Promise<void>((resolve) => {
    navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true })
    window.setTimeout(resolve, 1500)
  })
  if (navigator.serviceWorker.controller) return
  if (sessionStorage.getItem('kurio.sw-reload')) return
  sessionStorage.setItem('kurio.sw-reload', '1')
  location.reload()
  await new Promise<never>(() => {})
}

async function enableMocks() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return
  const [{ db }, { applyBootParams }] = await Promise.all([import('./mocks/db'), import('./mocks/boot')])
  const { search, reset } = applyBootParams(db, location.search, [localStorage, sessionStorage])
  if (reset) {
    // The session store already read its storage; a fresh load starts everything clean.
    location.replace(location.pathname + search + location.hash)
    await new Promise<never>(() => {})
  }
  if (search !== location.search) router.history.replace(location.pathname + search + location.hash)
  const { worker } = await import('./mocks/browser')
  // The service worker still answers every request; only its console chatter is off in the published build.
  await worker.start({ quiet: import.meta.env.PROD })
  await controlledByWorker()
  // Back from the background, the worker may have been restarted without this page: tell it again.
  onUnservedRequest(wakeWorker)
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && void wakeWorker())
  window.addEventListener('focus', () => void wakeWorker())
  window.addEventListener('online', () => void wakeWorker())
  // Orders that came due while the page was closed settle now.
  const [{ ctx }, { settleDue }] = await Promise.all([import('./mocks/runtime'), import('./mocks/services/orders')])
  settleDue(ctx)
  const { mountMockPanel } = await import('./mocks/panel')
  mountMockPanel()
}

// The screen is drawn at once; requests and the socket wait for the mock backend to be up.
const mocksReady = enableMocks()
holdRequestsUntil(mocksReady)
void mocksReady.then(() => connectRealtime(queryClient))

// A refused token ends the session and sends the user to login, remembering where they were.
onSessionLost((code) => {
  const back = router.state.location.href
  endSession(queryClient)
  void router.navigate({ to: '/entrar', search: { redirect: back, reason: code === 'session_expired' ? 'session_expired' : undefined } })
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
