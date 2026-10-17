import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/perfil')({ component: () => <main className="p-8"><h1>Perfil</h1></main> })
