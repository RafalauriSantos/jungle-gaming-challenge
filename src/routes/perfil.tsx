import { createFileRoute } from '@tanstack/react-router'
import { AccountShell } from '@/features/account/AccountShell'
import { requireSession } from '@/session/guard'

export const Route = createFileRoute('/perfil')({
  beforeLoad: ({ location }) => requireSession(location),
  component: () => (
    <AccountShell>
      <h1 className="text-base font-bold">Perfil do colecionador</h1>
    </AccountShell>
  ),
})
