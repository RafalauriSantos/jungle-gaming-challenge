import { createFileRoute } from '@tanstack/react-router'
import { LogoutButton } from '@/features/auth/LogoutButton'
import { requireSession } from '@/session/guard'

export const Route = createFileRoute('/perfil')({
  beforeLoad: ({ location }) => requireSession(location),
  component: () => (
    <main className="mx-auto flex max-w-[1200px] flex-col items-start gap-4 p-8">
      <h1>Perfil</h1>
      <LogoutButton />
    </main>
  ),
})
