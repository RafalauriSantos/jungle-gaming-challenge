import { useQuery } from '@tanstack/react-query'
import { nftListOptions } from '@/api/nfts'
import { ProductCarousel } from '@/features/catalog/ProductCarousel'

/** "Colecionadores também viram": the newest listings that are not already in the cart. */
export function RelatedProducts({ inCart }: { inCart: string[] }) {
  const { data } = useQuery(nftListOptions({ sort: 'recent' }))
  return <ProductCarousel title="Colecionadores também viram" items={(data?.items ?? []).filter((n) => !inCart.includes(n.id))} className="mt-24" />
}
