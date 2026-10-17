import { createFileRoute } from '@tanstack/react-router'
import { OrderPage } from '@/features/orders/OrderPage'
import { requireSession } from '@/session/guard'

export const Route = createFileRoute('/pedido/$id')({
  beforeLoad: ({ location }) => requireSession(location),
  component: Order,
})

function Order() {
  return <OrderPage id={Route.useParams().id} />
}
