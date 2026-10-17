import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { SlidersHorizontal } from 'lucide-react'
import { nftListOptions } from '@/api/nfts'
import { FEEDS, SORTS, type NftListParams, type Sort } from '@/api/types'
import { SearchBox } from '@/components/layout/SearchBox'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Blog } from '@/features/catalog/Blog'
import { FeaturedBanner } from '@/features/catalog/FeaturedBanner'
import { FiltersPanel } from '@/features/catalog/FiltersPanel'
import { Hero } from '@/features/catalog/Hero'
import { NftCard, NftCardSkeleton } from '@/features/catalog/NftCard'
import { Pagination } from '@/features/catalog/Pagination'
import { Promos } from '@/features/catalog/Promos'
import { FEED_LABELS, SORT_LABELS, validateCatalogSearch } from '@/features/catalog/search'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({
  validateSearch: validateCatalogSearch,
  component: Catalog,
})

const FILTERED = ['q', 'collection', 'network', 'minPrice', 'maxPrice', 'feed'] as const

function Catalog() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data, isPending, isError, isFetching, refetch } = useQuery(nftListOptions(search))

  // Any filter change goes back to page 1.
  const setFilter = (patch: Partial<NftListParams>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch, page: undefined }) })

  const filters = <FiltersPanel search={search} data={data} onChange={setFilter} />
  const hasFilters = FILTERED.some((k) => search[k] !== undefined)
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 pb-8 md:gap-24 md:pt-6">
      <div className="flex gap-3 md:hidden">
        <SearchBox className="flex-1" placeholder="Explorar coleções" />
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
                    'border-b-2 border-transparent pb-1 font-medium',
                    (search.feed ?? 'all') === f && 'border-text-accent font-bold text-text-accent',
                  )}
                >
                  {FEED_LABELS[f]}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-[15px]">
              Ordenar por:
              <select
                value={search.sort ?? 'recent'}
                onChange={(e) => setFilter({ sort: e.target.value === 'recent' ? undefined : (e.target.value as Sort) })}
                className="rounded border border-border bg-ink px-2 py-1"
              >
                {SORTS.map((s) => <option key={s} value={s}>{SORT_LABELS[s]}</option>)}
              </select>
            </label>
          </div>

          {isError && (
            <div role="alert" className="flex flex-col items-start gap-3 rounded-lg bg-surface-card p-6">
              <p>Não foi possível carregar os NFTs.</p>
              <Button onClick={() => refetch()}>Tentar novamente</Button>
            </div>
          )}
          {data?.items.length === 0 && (
            <div className="flex flex-col items-start gap-3 rounded-lg bg-surface-card p-6">
              <p>Nenhum NFT encontrado com esses filtros.</p>
              {hasFilters && (
                <Button
                  variant="outline"
                  onClick={() => navigate({ search: {} })}
                >
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
