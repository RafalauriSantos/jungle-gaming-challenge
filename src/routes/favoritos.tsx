import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/favoritos')({ component: () => <main className="p-8"><h1>Favoritos</h1></main> })
