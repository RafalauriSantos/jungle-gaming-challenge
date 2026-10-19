import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal } from 'lucide-react'
import { nftListOptions } from '@/api/nfts'
import { FEEDS, SORTS, type NftListParams, type Sort } from '@/api/types'
import { SearchBox } from '@/components/layout/SearchBox'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Blog } from './Blog'
import { FeaturedBanner } from './FeaturedBanner'
import { FiltersPanel } from './FiltersPanel'
import { Hero } from './Hero'
import { NftCard, NftCardSkeleton } from './NftCard'
import { Pagination } from './Pagination'
import { Promos } from './Promos'
import { FEED_LABELS, SORT_LABELS } from './search'
import { cn } from '@/lib/utils'

const FILTERED = ['q', 'collection', 'network', 'minPrice', 'maxPrice', 'feed'] as const

interface Props {
  search: NftListParams
  /** Applies a filter change; the page goes back to 1. */
  onChange: (patch: Partial<NftListParams>) => void
  onReset: () => void
}

export function CatalogPage({ search, onChange: setFilter, onReset }: Props) {
  const { data, isPending, isError, isFetching, refetch } = useQuery(nftListOptions(search))

  const filters = <FiltersPanel search={search} data={data} onChange={setFilter} />
  const hasFilters = FILTERED.some((k) => search[k] !== undefined)
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  return (
    <main className="mx-auto flex w-full max-w-[1232px] flex-col gap-6 px-6 pb-8 pt-6 md:gap-24 md:px-4 md:pt-6">
      {/* Below 1024 px the filters live in a drawer; from 768 px the search is in the header, so only the drawer's button stays. */}
      <div className="flex gap-3 md:justify-end lg:hidden">
        <SearchBox className="flex-1 md:hidden" placeholder="Explorar coleções" />
        <FiltersSheet>{filters}</FiltersSheet>
      </div>

      <Hero />

      <div id="catalogo" className="flex scroll-mt-4 gap-12">
        <aside aria-label="Filtros" className="hidden w-[310px] shrink-0 flex-col gap-6 lg:flex">
          {filters}
          <FeaturedBanner />
        </aside>

        <section aria-label="Catálogo" className="flex min-w-0 flex-1 flex-col gap-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="group" aria-label="Listagem" className="flex gap-4 text-sm md:gap-5 md:text-[15px]">
              {FEEDS.map((f) => (
                <button
                  key={f}
                  aria-pressed={(search.feed ?? 'all') === f}
                  onClick={() => setFilter({ feed: f === 'all' ? undefined : f })}
                  className={cn(
                    'touch relative border-b-2 border-transparent pb-1 font-medium',
                    (search.feed ?? 'all') === f && 'border-text-accent font-bold text-text-accent',
                  )}
                >
                  {FEED_LABELS[f]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[15px]">
              <span id="sort-label">Ordenar por:</span>
              <Select value={search.sort ?? 'recent'} onValueChange={(v) => setFilter({ sort: v === 'recent' ? undefined : (v as Sort) })}>
                <SelectTrigger aria-labelledby="sort-label" className="h-auto w-auto cursor-pointer gap-1 border-0 bg-transparent p-0 text-[15px] dark:bg-transparent dark:hover:bg-transparent">
                  <SelectValue>{(v: Sort) => SORT_LABELS[v]}</SelectValue>
                </SelectTrigger>
                <SelectContent align="start">
                  {SORTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SORT_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isError && (
            <div role="alert" className="flex flex-col items-start gap-3 rounded-lg bg-surface-card p-6">
              <p>Não foi possível carregar os NFTs.</p>
              <Button onClick={() => refetch()}>Tentar novamente</Button>
            </div>
          )}
          {data?.items.length === 0 && data.total > 0 && (
            <div className="flex flex-col items-start gap-3 rounded-lg bg-surface-card p-6">
              <p>Esta página não existe para a busca atual.</p>
              <Button variant="outline" onClick={() => setFilter({})}>
                Ver a primeira página
              </Button>
            </div>
          )}
          {data?.items.length === 0 && data.total === 0 && (
            <div className="flex flex-col items-start gap-3 rounded-lg bg-surface-card p-6">
              <p>Nenhum NFT encontrado com esses filtros.</p>
              {hasFilters && (
                <Button variant="outline" onClick={onReset}>
                  Limpar filtros
                </Button>
              )}
            </div>
          )}

          {isPending && !isError ? (
            <ul aria-label="Carregando NFTs" aria-busy="true" className={grid}>
              {Array.from({ length: 9 }, (_, i) => <NftCardSkeleton key={i} />)}
            </ul>
          ) : (
            data && data.items.length > 0 && (
              <ul aria-busy={isFetching} className={cn(grid, isFetching && 'opacity-70 transition-opacity')}>
                {data.items.map((n) => <NftCard key={n.id} nft={n} />)}
              </ul>
            )
          )}

          <p role="status" className="sr-only">
            {data ? `${data.total} NFTs encontrados` : ''}
          </p>
          <Pagination page={data?.page ?? 1} total={pages} />
        </section>
      </div>

      <Promos />
      <Blog />
    </main>
  )
}

const grid =
  'grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-6 md:gap-y-12 [&>li:nth-child(even)]:mt-8 md:[&>li:nth-child(even)]:mt-0'

function FiltersSheet({ children }: { children: React.ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger
        render={<Button aria-label="Abrir filtros" size="icon" className="size-11 rounded-[14px] lg:hidden" />}
      >
        <SlidersHorizontal aria-hidden />
      </SheetTrigger>
      <SheetContent side="left" className="w-[340px] max-w-full overflow-y-auto bg-ink p-0">
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
          <SheetDescription className="sr-only">Filtrar o catálogo por coleção, preço e rede</SheetDescription>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  )
}
