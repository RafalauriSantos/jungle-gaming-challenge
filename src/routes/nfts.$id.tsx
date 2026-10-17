import { createFileRoute } from '@tanstack/react-router'
import { NftDetail } from '@/features/nft/NftDetail'

export const Route = createFileRoute('/nfts/$id')({ component: Detail })

function Detail() {
  return <NftDetail id={Route.useParams().id} />
}
