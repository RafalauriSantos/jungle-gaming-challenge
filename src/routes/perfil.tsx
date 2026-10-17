import { createFileRoute } from '@tanstack/react-router'
import { AccountShell } from '@/features/account/AccountShell'
import { ProfileScreen } from '@/features/profile/ProfileScreen'
import { requireSession } from '@/session/guard'

export const Route = createFileRoute('/perfil')({
  beforeLoad: ({ location }) => requireSession(location),
  component: () => (
    <AccountShell>
      <ProfileScreen />
    </AccountShell>
  ),
})
