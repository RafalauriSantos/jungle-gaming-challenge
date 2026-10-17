import { createFileRoute } from '@tanstack/react-router'
import { PaymentPage } from '@/features/orders/PaymentPage'
import { requireSession } from '@/session/guard'

export const Route = createFileRoute('/pagamento')({
  beforeLoad: ({ location }) => requireSession(location),
  component: PaymentPage,
})
