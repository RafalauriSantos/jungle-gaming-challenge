import { useQuery } from '@tanstack/react-query'
import { nftDetailOptions } from '@/api/nfts'
import type { SkippedLine } from '@/api/types'
import { useMergeSkipped } from './useVisitorMerge'

function Line({ line }: { line: SkippedLine }) {
  const nft = useQuery(nftDetailOptions(line.nftId)).data
  const name = nft?.name ?? 'NFT'
  const tier = nft?.editions.find((e) => e.id === line.editionId)?.tier
  const what = tier ? `${name} (${tier})` : name
  return (
    <li>
      {line.reason === 'network_mismatch'
        ? `${what} não foi adicionado: é de outra rede que a do seu carrinho.`
        : `${what}: só ${line.applied} de ${line.requested} cabiam no estoque.`}
    </li>
  )
}

/** What the visitor cart could not bring along when the user signed in. */
export function MergeSkipped() {
  const skipped = useMergeSkipped()
  if (skipped.length === 0) return null
  return (
    <section role="status" aria-label="Itens do carrinho de visitante" className="mb-4 rounded-lg bg-surface-card p-4 text-sm">
      <p className="font-bold">Nem tudo do seu carrinho de visitante entrou:</p>
      <ul className="mt-1 list-disc pl-5">
        {skipped.map((line) => (
          <Line key={`${line.nftId}-${line.editionId}`} line={line} />
        ))}
      </ul>
    </section>
  )
}
