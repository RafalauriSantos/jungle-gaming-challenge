import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/carrinho')({ component: () => <main className="p-8"><h1>Carrinho</h1></main> })
