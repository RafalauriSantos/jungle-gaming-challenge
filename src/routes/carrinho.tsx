import { createFileRoute } from '@tanstack/react-router'
import { CartPage } from '@/features/cart/CartPage'
import { requireSession } from '@/session/guard'

export const Route = createFileRoute('/carrinho')({
  beforeLoad: ({ location }) => requireSession(location),
  component: CartPage,
})
