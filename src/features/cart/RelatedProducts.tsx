import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { nftListOptions } from '@/api/nfts'
import { formatEth } from '@/lib/eth'
import { cn } from '@/lib/utils'

const PER_PAGE = 5

/** "Colecionadores também viram": the newest listings that are not already in the cart, five at a time. */
export function RelatedProducts({ inCart }: { inCart: string[] }) {
  const { data } = useQuery(nftListOptions({ sort: 'recent' }))
  const [page, setPage] = useState(0)
  const items = (data?.items ?? []).filter((n) => !inCart.includes(n.id))
  const pages = Math.ceil(items.length / PER_PAGE)
  if (items.length === 0) return null
  const shown = items.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE)
  return (
    <section aria-labelledby="related" className="mt-24 flex flex-col items-center gap-8">
      <div className="flex w-full flex-col gap-3">
        <h2 id="related" className="text-[17px] font-bold leading-4 text-text-accent">Colecionadores também viram</h2>
        <div className="h-px w-full bg-border" />
      </div>
      <ul className="flex w-full justify-between">
        {shown.map((n) => (
          <li key={n.id}>
            <Link to="/nfts/$id" params={{ id: n.id }} className="flex flex-col gap-2">
              <span className="grid h-[255px] w-[219px] place-items-center bg-surface-card">
                <img src={n.image} alt={`Arte do NFT ${n.name}`} width={190} height={243} loading="lazy" className="h-[243px] w-[190px] rounded-[15px] object-cover" />
              </span>
              <span className="text-[15px]">{n.name}</span>
              <span className="text-base font-bold leading-4 text-text-accent">{formatEth(n.price)}</span>
            </Link>
          </li>
        ))}
      </ul>
      {pages > 1 && (
        <div role="group" aria-label="Páginas de sugestões" className="flex items-center gap-2">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Sugestões, página ${i + 1} de ${pages}`}
              aria-current={i === page ? 'true' : undefined}
              onClick={() => setPage(i)}
              className={cn('size-3 rounded-full border border-primary', i === page && 'bg-primary')}
            />
          ))}
        </div>
      )}
    </section>
  )
}
