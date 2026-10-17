import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { connectRealtime } from './realtime/client'
import { routeTree } from './routeTree.gen'
import { endSession } from './session/actions'
import { onSessionLost } from './session/store'

const queryClient = new QueryClient()
const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

async function enableMocks() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return
  const [{ db }, { applyBootParams }] = await Promise.all([import('./mocks/db'), import('./mocks/boot')])
  const { search, reset } = applyBootParams(db, location.search, localStorage)
  if (reset) {
    // The session store already read its storage; a fresh load starts everything clean.
    location.replace(location.pathname + search + location.hash)
    await new Promise<never>(() => {})
  }
  if (search !== location.search) history.replaceState(null, '', location.pathname + search + location.hash)
  const { worker } = await import('./mocks/browser')
  await worker.start()
  const { mountMockPanel } = await import('./mocks/panel')
  mountMockPanel()
}

await enableMocks()
void connectRealtime(queryClient)

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
