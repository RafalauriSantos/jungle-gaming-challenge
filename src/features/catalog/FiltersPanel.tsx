import { Check } from 'lucide-react'
import { useState } from 'react'
import { COLLECTIONS, NETWORKS, type NftListParams, type NftListResponse } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { centiToEth, ethToCenti, formatEth } from '@/lib/eth'
import { cn } from '@/lib/utils'
import { COLLECTION_LABELS, NETWORK_LABELS } from './search'

interface Props {
  search: NftListParams
  data?: NftListResponse
  onChange: (patch: Partial<NftListParams>) => void
}

const toggle = <T,>(list: T[] | undefined, v: T) =>
  list?.includes(v) ? list.filter((x) => x !== v) : [...(list ?? []), v]

function Heading({ children }: { children: string }) {
  return <h2 className="text-lg font-bold leading-4">{children}</h2>
}

function CheckList<T extends string>({
  legend,
  values,
  labels,
  selected,
  counts,
  onToggle,
}: {
  legend: string
  values: readonly T[]
  labels: Record<T, string>
  selected?: T[]
  counts?: Record<T, number>
  onToggle: (v: T) => void
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3">
        <Heading>{legend}</Heading>
      </legend>
      <div className="px-3">
        {values.map((v) => {
          const on = selected?.includes(v)
          return (
            <label
              key={v}
              className={cn(
                'flex cursor-pointer items-center justify-between text-[15px] leading-10 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-text-accent',
                on ? 'text-text-accent' : 'text-text-secondary',
              )}
            >
              <input type="checkbox" className="sr-only" checked={!!on} onChange={() => onToggle(v)} />
              <span className="flex items-center gap-2">
                {on && <Check aria-hidden className="size-4" />}
                {labels[v]}
              </span>
              <span className="font-bold">({counts?.[v] ?? '–'})</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function FiltersPanel({ search, data, onChange }: Props) {
  const range = data?.priceRange ?? { min: '0', max: '0' }
  // The slider works in whole hundredths of an ETH; money itself stays a string.
  const lo = ethToCenti(search.minPrice ?? range.min)
  const hi = ethToCenti(search.maxPrice ?? range.max)
  const [draft, setDraft] = useState<[number, number] | null>(null)
  const [from, to] = draft ?? [lo, hi]
  const fmt = (n: number) => formatEth(centiToEth(n)).replace(' ETH', '').replace('.', ',')

  return (
    <div className="flex flex-col gap-10 bg-surface-card p-5">
      <CheckList
        legend="Coleções"
        values={COLLECTIONS}
        labels={COLLECTION_LABELS}
        selected={search.collection}
        counts={data?.facets.collection}
        onToggle={(v) => onChange({ collection: toggle(search.collection, v) })}
      />

      <div className="flex flex-col gap-3">
        <Heading>Faixa de preço</Heading>
        <div className="flex flex-col gap-3 pl-3">
          <Slider
            aria-label="Faixa de preço em ETH"
            min={ethToCenti(range.min)}
            max={ethToCenti(range.max)}
            step={1}
            value={[from, to]}
            onValueChange={(v) => Array.isArray(v) && setDraft([v[0]!, v[1]!])}
            disabled={!data}
          />
          <p className="text-[15px]">
            Preço: {fmt(from)} - {fmt(to)} ETH
          </p>
          <Button
            className="w-fit rounded-md px-3 text-base font-bold"
            disabled={!data || !draft}
            onClick={() => {
              onChange({ minPrice: centiToEth(from), maxPrice: centiToEth(to) })
              setDraft(null)
            }}
          >
            Aplicar
          </Button>
        </div>
      </div>

      <CheckList
        legend="Rede"
        values={NETWORKS}
        labels={NETWORK_LABELS}
        selected={search.network}
        counts={data?.facets.network}
        onToggle={(v) => onChange({ network: toggle(search.network, v) })}
      />
    </div>
  )
}
