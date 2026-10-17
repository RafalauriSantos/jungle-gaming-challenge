import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '@/session/guard'

export const Route = createFileRoute('/favoritos')({
  beforeLoad: ({ location }) => requireSession(location),
  component: () => (
    <main className="p-8">
      <h1>Favoritos</h1>
    </main>
  ),
})
