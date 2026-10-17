import { Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { errorBodyOf } from '@/api/client'
import type { Quote, QuoteLine } from '@/api/types'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Stepper } from '@/features/nft/Stepper'
import { formatEth } from '@/lib/eth'
import { useCoupon } from './useCoupon'
import { useCart, useQuote, useRemoveItem, useSetQuantity } from './useCart'

function Row({ line, disabled, onQuantity, onRemove }: { line: QuoteLine; disabled: boolean; onQuantity: (q: number) => void; onRemove: () => void }) {
  return (
    <li className="grid grid-cols-[72px_1fr_auto] items-center gap-x-4 gap-y-2 rounded-lg bg-surface-card p-2 md:grid-cols-[minmax(0,1fr)_100px_130px_100px_40px]">
      <div className="col-span-2 flex items-center gap-3 md:col-span-1">
        <img src={line.image} alt={`Arte do NFT ${line.name}`} width={40} height={48} className="h-12 w-10 shrink-0 rounded-sm object-cover" />
        <div className="min-w-0">
          <p className="truncate font-bold">{line.name}</p>
          <p className="text-xs text-text-secondary">ID do token: {line.tokenId}</p>
          <p className="text-xs text-text-secondary">Edição: {line.tier}</p>
        </div>
      </div>
      <p className="hidden text-xs font-bold text-text-accent md:block">{formatEth(line.unitPrice)}</p>
      <Stepper label={`Quantidade de ${line.name}`} value={line.quantity} max={Math.max(line.available, 1)} onChange={onQuantity} disabled={disabled} className="col-start-2 md:col-start-auto" />
      <p className="col-start-3 row-start-1 text-sm font-bold text-text-accent md:col-start-auto md:row-start-auto md:text-xs">
        <span className="sr-only">Total da linha </span>
        {formatEth(line.lineTotal)}
      </p>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remover ${line.name}`} onClick={onRemove} disabled={disabled} className="col-start-3 justify-self-end md:col-start-auto">
        <Trash2 aria-hidden />
      </Button>
    </li>
  )
}

function Summary({ quote, updating, coupon, onApply, onRemoveCoupon, blocked }: { quote: Quote; updating: boolean; coupon: string; onApply: (code: string) => void; onRemoveCoupon: () => void; blocked: boolean }) {
  const [draft, setDraft] = useState('')
  const status = quote.coupon?.status
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (draft.trim()) onApply(draft.trim())
  }
  return (
    <section aria-labelledby="summary" aria-busy={updating} className="flex flex-col gap-3 rounded-2xl bg-surface-card p-4 md:rounded-none md:bg-transparent md:p-0">
      <h2 id="summary" className="hidden border-b border-border pb-2 font-bold md:block">Resumo da carteira</h2>
      {coupon ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>
            Código <strong>{coupon}</strong>
          </span>
          <Button type="button" variant="link" className="h-auto p-0 text-text-accent" onClick={onRemoveCoupon}>Remover código</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex" aria-label="Cupom">
          <label htmlFor="coupon" className="sr-only">Código promocional</label>
          <Input id="coupon" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Digite o código promocional..." className="rounded-r-none" />
          <Button type="submit" className="h-10 rounded-l-none">Aplicar</Button>
        </form>
      )}
      <p role={status === 'applied' ? 'status' : 'alert'} className={status === 'applied' ? 'text-sm text-text-accent' : 'text-sm text-destructive'}>
        {status === 'applied' ? 'Código aplicado.' : (quote.coupon?.message ?? '')}
      </p>
      <dl className={`grid grid-cols-[1fr_auto] gap-y-2 text-sm ${updating ? 'opacity-60' : ''}`}>
        <dt>Subtotal</dt><dd className="text-right">{formatEth(quote.subtotal)}</dd>
        <dt>Desconto do lançamento</dt><dd className="text-right">(-) {formatEth(quote.discount)}</dd>
        <dt>Taxa de rede</dt><dd className="text-right">{formatEth(quote.networkFee)}<span className="block text-[11px] text-text-accent">Taxa estimada</span></dd>
        <dt className="border-t border-border pt-3 font-bold">Total</dt><dd className="border-t border-border pt-3 text-right font-bold text-text-accent">{formatEth(quote.total)}</dd>
      </dl>
      {blocked || updating ? (
        <Button className="h-10 font-bold" disabled>
          Conectar e finalizar
        </Button>
      ) : (
        <Link to="/pagamento" className={buttonVariants({ className: 'h-10 font-bold' })}>
          Conectar e finalizar
        </Link>
      )}
      <Link to="/" className="text-center text-xs text-text-secondary underline">Continuar explorando</Link>
    </section>
  )
}

export function CartPage() {
  const router = useRouter()
  const cart = useCart()
  const [coupon, setCoupon] = useCoupon()
  const quote = useQuote(cart.data?.version, coupon)
  const setQuantity = useSetQuantity()
  const remove = useRemoveItem()
  const [error, setError] = useState<string>()

  const act = (run: Promise<unknown>) => {
    setError(undefined)
    run.catch((e) => {
      const body = errorBodyOf(e)
      const available = (body?.details as { available?: number } | undefined)?.available
      setError(body?.code === 'availability_conflict' ? `Quantidade acima do estoque. Restam ${available}.` : (body?.message ?? 'Não foi possível atualizar o carrinho.'))
    })
  }

  if (cart.isError) {
    return (
      <main className="mx-auto flex max-w-[1200px] flex-col items-start gap-3 px-4 py-12">
        <p role="alert">Não foi possível carregar seu carrinho.</p>
        <Button onClick={() => cart.refetch()}>Tentar novamente</Button>
      </main>
    )
  }
  const empty = cart.data && cart.data.items.length === 0

  return (
    <main className="mx-auto max-w-[1200px] px-4 pb-8 pt-4">
      <div className="mb-4 flex items-center gap-3 md:hidden">
        <Button type="button" variant="outline" size="icon" aria-label="Voltar" onClick={() => router.history.back()} className="rounded-full">
          <ArrowLeft aria-hidden />
        </Button>
        <h1 className="flex-1 pr-10 text-center text-xl font-bold">Carrinho de NFTs</h1>
      </div>
      <nav aria-label="Você está em" className="mb-4 hidden text-xs md:block">
        <Link to="/">Início</Link> / <span>Mercado</span> / <span aria-current="page">Carrinho</span>
      </nav>
      <h1 className="sr-only md:not-sr-only md:mb-4 md:text-base md:font-bold">Carrinho</h1>

      {empty ? (
        <div className="flex flex-col items-start gap-3 rounded-lg bg-surface-card p-6">
          <p>Seu carrinho está vazio.</p>
          <Link to="/" className={buttonVariants()}>Explorar NFTs</Link>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-[1fr_360px]">
          <section aria-label="Itens do carrinho">
            <div role="presentation" aria-hidden className="mb-2 hidden grid-cols-[minmax(0,1fr)_100px_130px_100px_40px] gap-x-4 px-2 text-xs font-bold md:grid">
              <span>NFTs</span><span>Preço</span><span>Edições</span><span>Total</span><span />
            </div>
            {quote.isPending || cart.isPending ? (
              <ul aria-busy="true" aria-label="Carregando itens" className="flex flex-col gap-3">
                {[0, 1, 2].map((i) => <li key={i}><Skeleton className="h-[64px] w-full" /></li>)}
              </ul>
            ) : quote.isError ? (
              <div role="alert" className="flex flex-col items-start gap-3 rounded-lg bg-surface-card p-6">
                <p>Não foi possível calcular o resumo do carrinho.</p>
                <Button onClick={() => quote.refetch()}>Tentar novamente</Button>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {quote.data.lines.map((line) => (
                  <Row
                    key={line.lineId}
                    line={line}
                    disabled={setQuantity.isPending || remove.isPending}
                    onQuantity={(q) => act(setQuantity.mutateAsync({ nftId: line.nftId, editionId: line.editionId, quantity: q }))}
                    onRemove={() => act(remove.mutateAsync({ nftId: line.nftId, editionId: line.editionId }))}
                  />
                ))}
              </ul>
            )}
            <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>
            {quote.data?.issues.map((issue) => (
              <p key={issue.editionId} role="alert" className="mt-2 text-sm text-destructive">
                {quote.data.lines.find((l) => l.editionId === issue.editionId)?.name}: restam apenas {issue.available} nesta edição. Ajuste a quantidade para continuar.
              </p>
            ))}
          </section>

          {quote.data ? (
            <Summary quote={quote.data} updating={quote.isFetching} coupon={coupon} onApply={setCoupon} onRemoveCoupon={() => setCoupon('')} blocked={quote.data.issues.length > 0} />
          ) : (
            <div aria-busy="true" role="status" aria-label="Carregando resumo" className="flex flex-col gap-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
        </div>
      )}
    </main>
  )
}
