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
  const { worker } = await import('./mocks/browser')
  await worker.start()
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
