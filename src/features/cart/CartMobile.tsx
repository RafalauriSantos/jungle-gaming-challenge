import { Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Stepper } from '@/features/nft/Stepper'
import { formatEth } from '@/lib/eth'
import type { CartModel } from './cartModel'
import { Checkout, CouponForm, CouponStatus, Notices, Totals } from './CartParts'
import { MergeSkipped } from './MergeSkipped'

export function CartMobile({ m, empty }: { m: CartModel; empty: boolean }) {
  const router = useRouter()
  const lines = m.quote?.lines ?? []
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-1rem)] max-w-[414px] flex-col gap-1 pt-4">
      <div className="flex flex-col gap-3 px-7">
        <div className="flex h-11 items-center gap-[61px]">
          <Button type="button" variant="outline" size="icon" aria-label="Voltar" onClick={() => router.history.back()} className="size-[35px] rounded-full border-border-soft bg-surface-card">
            <ArrowLeft aria-hidden className="size-4 text-text-accent" />
          </Button>
          <h1 className="text-xl font-bold leading-4">Carrinho de NFTs</h1>
        </div>
        <MergeSkipped />

        {empty ? (
          <div className="flex flex-col items-start gap-3 rounded-[14px] bg-surface-card p-6">
            <p>Seu carrinho está vazio.</p>
            <Link to="/" className="inline-flex h-10 items-center rounded-md bg-primary px-4 font-bold text-ink">Explorar NFTs</Link>
          </div>
        ) : m.loading ? (
          <ul aria-busy="true" aria-label="Carregando itens" className="flex flex-col gap-5">
            {[0, 1].map((i) => <li key={i}><Skeleton className="h-[100px] w-full rounded-[14px]" /></li>)}
          </ul>
        ) : m.loadFailed ? (
          <div role="alert" className="flex flex-col items-start gap-3 rounded-[14px] bg-surface-card p-6">
            <p>Não foi possível calcular o resumo do carrinho.</p>
            <Button onClick={m.retryQuote}>Tentar novamente</Button>
          </div>
        ) : (
          <ul aria-label="Itens do carrinho" className="flex flex-col gap-5">
            {lines.map((line) => (
              <li key={line.lineId} className="relative h-[100px] overflow-hidden rounded-[14px] bg-surface-card shadow-[0_6px_20px_rgba(10,6,4,0.45)]">
                <img src={line.image} alt={`Arte do NFT ${line.name}`} width={100} height={100} className="absolute left-0 top-0 size-[100px] object-cover" />
                <p className="absolute left-[109px] top-[13px] right-4 truncate text-[15px] font-bold leading-4">{line.name}</p>
                <p className="absolute left-[109px] top-[35px] text-sm leading-4 text-text-secondary"><span className="max-[359px]:sr-only">Edição: </span>{line.tier}</p>
                <p className="absolute left-[109px] top-[69px] text-lg font-bold leading-4 text-text-accent">
                  <span className="sr-only">Total da linha </span>
                  {formatEth(line.lineTotal)}
                </p>
                <Stepper variant="round" label={`Quantidade de ${line.name}`} value={line.quantity} max={Math.max(line.available, 1)} onChange={(q) => m.setQuantity(line, q)} disabled={m.busy} className="absolute right-3 top-[38px] gap-[13px]" />
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remover ${line.name}`} onClick={() => m.remove(line)} disabled={m.busy} className="absolute right-3 top-2 size-6">
                  <Trash2 aria-hidden className="size-[18px]" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <Notices m={m} />
      </div>

      {!empty && (
        <section aria-labelledby="summary" aria-busy={m.updating} className="mt-auto flex flex-col gap-6 rounded-t-[40px] bg-surface-card px-6 pb-9 pt-6">
          <h2 id="summary" className="sr-only">Resumo da carteira</h2>
          {m.quote ? (
            <>
              <div className="flex flex-col gap-3">
                <CouponForm m={m} pill />
                <CouponStatus m={m} />
                <Totals m={m} value="text-base" />
              </div>
              <Checkout m={m} className="h-[60px] w-full rounded-[40px] bg-gradient-to-br from-primary from-[4%] to-primary/80 text-base font-bold text-ink">Conectar e finalizar</Checkout>
              <Link to="/" className="-mt-2 text-center text-sm text-text-accent">Continuar explorando</Link>
            </>
          ) : (
            <div aria-busy="true" role="status" aria-label="Carregando resumo" className="flex flex-col gap-3">
              <Skeleton className="h-[50px] w-full rounded-[40px]" /><Skeleton className="h-28 w-full" /><Skeleton className="h-[60px] w-full rounded-[40px]" />
            </div>
          )}
        </section>
      )}
    </main>
  )
}
