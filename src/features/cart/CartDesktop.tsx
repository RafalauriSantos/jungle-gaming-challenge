import { Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Stepper } from '@/features/nft/Stepper'
import { formatEth } from '@/lib/eth'
import { cn } from '@/lib/utils'
import type { CartModel } from './cartModel'
import { Checkout, CouponForm, CouponStatus, Notices, Totals } from './CartParts'
import { MergeSkipped } from './MergeSkipped'
import { RelatedProducts } from './RelatedProducts'

// Name and picture, price, quantity, line total, remove. The table is 782 px wide in the frame.
const COLUMNS = 'md:grid-cols-[250px_77px_75px_87px_24px] md:justify-between'

export function CartDesktop({ m, empty }: { m: CartModel; empty: boolean }) {
  const lines = m.quote?.lines ?? []
  return (
    <main className="mx-auto max-w-[1232px] px-4 pb-10 pt-8">
      <nav aria-label="Você está em" className="text-[15px] font-bold leading-4">
        <Link to="/">Início</Link> / <span>Mercado</span> / <span aria-current="page">Carrinho</span>
      </nav>
      <h1 className="sr-only">Carrinho</h1>
      <MergeSkipped />

      {empty ? (
        <div className="mt-3 flex flex-col items-start gap-3 rounded-lg bg-surface-card p-6">
          <p>Seu carrinho está vazio.</p>
          <Link to="/" className="inline-flex h-10 items-center rounded-md bg-primary px-4 font-bold text-ink">Explorar NFTs</Link>
        </div>
      ) : (
        <div className="mt-3 flex items-start justify-between gap-8">
          <section aria-label="Itens do carrinho" className="flex w-[782px] min-w-0 flex-col gap-3">
            <div role="presentation" aria-hidden className={cn('grid items-center pr-6 text-base leading-4', COLUMNS)}>
              <span className="font-bold">NFTs</span><span className="font-medium">Preço</span><span className="font-bold">Edições</span><span className="font-medium">Total</span><span />
            </div>
            <div className="h-px bg-border" />
            {m.loading ? (
              <ul aria-busy="true" aria-label="Carregando itens" className="flex flex-col gap-3">
                {[0, 1, 2].map((i) => <li key={i}><Skeleton className="h-[70px] w-full" /></li>)}
              </ul>
            ) : m.loadFailed ? (
              <div role="alert" className="flex flex-col items-start gap-3 rounded-lg bg-surface-card p-6">
                <p>Não foi possível calcular o resumo do carrinho.</p>
                <Button onClick={m.retryQuote}>Tentar novamente</Button>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {lines.map((line) => (
                  <li key={line.lineId} className={cn('grid h-[70px] items-center bg-surface-card pr-6', COLUMNS)}>
                    <div className="flex items-center gap-4">
                      <img src={line.image} alt={`Arte do NFT ${line.name}`} width={70} height={70} className="size-[70px] shrink-0 rounded-md object-cover" />
                      <div className="flex w-[164px] flex-col gap-1 leading-4">
                        <p className="truncate text-base font-bold" title={line.name}>{line.name}</p>
                        <p className="text-sm text-tone">ID do token: {line.tokenId}</p>
                        <p className="text-sm text-tone">Edição: {line.tier}</p>
                      </div>
                    </div>
                    <p className="whitespace-nowrap text-base font-bold leading-4 text-text-secondary">{formatEth(line.unitPrice)}</p>
                    <Stepper variant="pill" label={`Quantidade de ${line.name}`} value={line.quantity} max={Math.max(line.available, 1)} onChange={(q) => m.setQuantity(line, q)} disabled={m.busy} className="justify-between gap-0" />
                    <p className="text-base font-bold leading-4 text-text-accent">
                      <span className="sr-only">Total da linha </span>
                      {formatEth(line.lineTotal)}
                    </p>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remover ${line.name}`} onClick={() => m.remove(line)} disabled={m.busy} className="size-6">
                      <Trash2 aria-hidden className="size-5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <Notices m={m} />
          </section>

          {m.quote ? (
            <section aria-labelledby="summary" aria-busy={m.updating} className="flex w-[332px] shrink-0 flex-col gap-6">
              <div className="flex flex-col gap-3">
                <h2 id="summary" className="text-lg font-bold leading-4">Resumo da carteira</h2>
                <div className="h-px bg-border" />
              </div>
              <div className="flex flex-col gap-2">
                <CouponForm m={m} />
                <CouponStatus m={m} />
              </div>
              <Totals m={m} value="text-lg" />
              <div className="flex flex-col items-center gap-3">
                <Checkout m={m} className="h-10 w-full rounded-[3px] bg-primary text-[15px] font-bold text-ink">Conectar e finalizar</Checkout>
                <Link to="/" className="text-[15px] text-text-accent">Continuar explorando</Link>
              </div>
            </section>
          ) : (
            <div aria-busy="true" role="status" aria-label="Carregando resumo" className="flex w-[332px] flex-col gap-3">
              <Skeleton className="h-6 w-40" /><Skeleton className="h-10 w-full" /><Skeleton className="h-28 w-full" /><Skeleton className="h-10 w-full" />
            </div>
          )}
        </div>
      )}

      {!empty && <RelatedProducts inCart={lines.map((l) => l.nftId)} />}
    </main>
  )
}
