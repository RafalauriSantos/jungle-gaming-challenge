import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '@/session/guard'

export const Route = createFileRoute('/carrinho')({
  beforeLoad: ({ location }) => requireSession(location),
  component: () => (
    <main className="p-8">
      <h1>Carrinho</h1>
    </main>
  ),
})
