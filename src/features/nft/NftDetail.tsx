import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { nftDetailOptions } from '@/api/nfts'
import type { Nft } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { DetailDesktop } from './DetailDesktop'
import { DetailMobile } from './DetailMobile'
import { useBuy } from './useBuy'

function DetailSkeleton() {
  return (
    <div aria-busy="true" role="status" aria-label="Carregando NFT" className="mx-auto grid max-w-[1232px] gap-8 px-4 py-6 md:grid-cols-[100px_444px_1fr]">
      <Skeleton className="hidden h-[448px] md:block" />
      <Skeleton className="aspect-square w-full md:size-[444px]" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-2/3" />
      </div>
    </div>
  )
}

function Missing() {
  return (
    <main className="mx-auto max-w-[1232px] px-4 py-16">
      <h1 className="mb-4 text-2xl font-bold">NFT não encontrado</h1>
      <p className="mb-4 text-text-secondary">Ele pode ter sido removido ou o endereço está incorreto.</p>
      <Link to="/" className="text-text-accent underline">Voltar ao catálogo</Link>
    </main>
  )
}

/** One NFT, drawn as the desktop or the mobile frame; the choices and the buying are the same for both. */
function Loaded({ nft }: { nft: Nft }) {
  const desktop = useMediaQuery('(min-width: 768px)')
  const buy = useBuy(nft)
  return desktop ? <DetailDesktop nft={nft} buy={buy} /> : <DetailMobile nft={nft} buy={buy} />
}

export function NftDetail({ id }: { id: string }) {
  const { data: nft, isPending, isError, error, refetch } = useQuery(nftDetailOptions(id))

  if (isPending) return <DetailSkeleton />
  if (isError) {
    if (isAxiosError(error) && error.response?.status === 404) return <Missing />
    return (
      <main className="mx-auto flex max-w-[1232px] flex-col items-start gap-3 px-4 py-16">
        <p role="alert">Não foi possível carregar este NFT.</p>
        <Button onClick={() => refetch()}>Tentar novamente</Button>
      </main>
    )
  }
  // A new NFT starts its edition and quantity again.
  return <Loaded key={nft.id} nft={nft} />
}
