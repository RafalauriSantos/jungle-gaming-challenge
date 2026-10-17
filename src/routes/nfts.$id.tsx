import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/nfts/$id')({ component: () => <main className="p-8"><h1>NFT</h1></main> })
