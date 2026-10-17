import { createFileRoute } from '@tanstack/react-router'
import { AccountShell } from '@/features/account/AccountShell'
import { WalletsScreen } from '@/features/wallets/WalletsScreen'
import { requireSession } from '@/session/guard'

export const Route = createFileRoute('/carteiras')({
  beforeLoad: ({ location }) => requireSession(location),
  component: () => (
    <AccountShell>
      <WalletsScreen />
    </AccountShell>
  ),
})
