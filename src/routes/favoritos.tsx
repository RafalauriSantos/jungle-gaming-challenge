import { createFileRoute } from '@tanstack/react-router'
import { FavoritesPage } from '@/features/favorites/FavoritesPage'
import { requireSession } from '@/session/guard'

export const Route = createFileRoute('/favoritos')({
  beforeLoad: ({ location }) => requireSession(location),
  component: FavoritesPage,
})
