import { useQueries } from '@tanstack/react-query'
import { nftDetailOptions } from '@/api/nfts'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { NftCard } from '@/features/catalog/NftCard'
import { useFavorites } from './useFavorites'

export function FavoritesPage() {
  const favorites = useFavorites()
  const ids = favorites.data?.nftIds ?? []
  const nfts = useQueries({ queries: ids.map((id) => nftDetailOptions(id)) })

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-8 md:px-8">
      <h1 className="mb-6 text-xl font-bold">Favoritos</h1>
      {favorites.isError ? (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-lg bg-surface-card p-6">
          <p>Não foi possível carregar seus favoritos.</p>
          <Button onClick={() => favorites.refetch()}>Tentar novamente</Button>
        </div>
      ) : favorites.isPending ? (
        <Skeleton role="status" aria-label="Carregando favoritos" className="h-64 w-full" />
      ) : ids.length === 0 ? (
        <p>Você ainda não favoritou nenhum NFT.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {nfts.map((q) => (q.data ? <NftCard key={q.data.id} nft={q.data} /> : null))}
        </ul>
      )}
    </main>
  )
}
