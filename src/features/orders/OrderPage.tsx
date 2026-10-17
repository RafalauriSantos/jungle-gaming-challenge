import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { orderOptions } from '@/api/orders'
import type { Order } from '@/api/types'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PROVIDER_LABELS } from '@/features/wallets/WalletFields'
import { formatEth } from '@/lib/eth'
import { useUser } from '@/session/store'
import { clearAttempt } from './attempt'

const REASONS = {
  payment_refused: 'O pagamento foi recusado pela carteira.',
  insufficient_funds: 'Saldo insuficiente na carteira.',
  stock_lost: 'Um dos itens deixou de estar disponível.',
} as const

const shortRef = (tx: string) => `${tx.slice(0, 6)}…${tx.slice(-4)}`
const day = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })

function Card({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <main className="mx-auto grid min-h-[70dvh] max-w-[1200px] place-items-center px-4 py-10">
      <section aria-label={label} className="w-full max-w-[500px] overflow-hidden bg-surface-card">
        {children}
        <div aria-hidden className="h-[10px] bg-primary" />
      </section>
    </main>
  )
}

function Items({ order }: { order: Order }) {
  return (
    <div className="px-8 pb-6">
      <h2 className="mb-2 mt-4 text-xs font-bold">Detalhes da transação</h2>
      <div aria-hidden className="grid grid-cols-[1fr_auto_auto] gap-x-6 border-b border-border pb-1 text-xs font-bold"><span>NFTs</span><span>Edições</span><span>Subtotal</span></div>
      <ul className="mt-2 flex flex-col gap-3">
        {order.quote.lines.map((l) => (
          <li key={l.lineId} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6">
            <div className="flex items-center gap-2">
              <img src={l.image} alt="" width={36} height={44} className="h-11 w-9 rounded-sm object-cover" />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold">{l.name}</p>
                <p className="text-[11px] text-text-secondary">ID do token: {l.tokenId}</p>
              </div>
            </div>
            <span className="text-xs text-text-secondary">(x {l.quantity})</span>
            <span className="text-sm font-bold text-text-accent">{formatEth(l.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-3 grid grid-cols-[1fr_auto] gap-y-1 text-xs">
        <dt className="text-right">Taxa de rede</dt><dd className="pl-6 text-right">{formatEth(order.quote.networkFee)}</dd>
        <dt className="text-right font-bold">Total</dt><dd className="pl-6 text-right font-bold text-text-accent">{formatEth(order.quote.total)}</dd>
      </dl>
    </div>
  )
}

export function OrderPage({ id }: { id: string }) {
  const user = useUser()!
  const { data: order, isPending, isError, error, refetch } = useQuery(orderOptions(user.id, id, true))
  const [waitedLong, setWaitedLong] = useState(false)
  const finalStatus = order && order.status !== 'pending'
  useEffect(() => {
    if (finalStatus) clearAttempt(localStorage, user.id)
  }, [finalStatus, user.id])
  useEffect(() => {
    const t = setTimeout(() => setWaitedLong(true), 60_000)
    return () => clearTimeout(t)
  }, [])

  // The socket announces the status first; the receipt arrives with the refetch it triggers.
  const awaitingReceipt = order?.status === 'confirmed' && !order.receipt
  if (isPending || awaitingReceipt) {
    return (
      <Card label="Carregando pedido">
        <div role="status" aria-busy="true" className="flex flex-col gap-3 p-8"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-24 w-full" /></div>
      </Card>
    )
  }
  if (isError) {
    const status = isAxiosError(error) ? error.response?.status : undefined
    return (
      <Card label="Pedido indisponível">
        <div role="alert" className="flex flex-col items-start gap-3 p-8">
          <h1 className="text-lg font-bold">{status === 403 ? 'Você não tem acesso a este pedido' : status === 404 ? 'Pedido não encontrado' : 'Não foi possível carregar o pedido'}</h1>
          {status !== 403 && status !== 404 && <Button onClick={() => refetch()}>Tentar novamente</Button>}
          <Link to="/" className="text-text-accent underline">Voltar ao início</Link>
        </div>
      </Card>
    )
  }

  if (order.status === 'pending') {
    return (
      <Card label="Pedido em andamento">
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-3 px-8 pb-2 pt-10 text-center">
          <Clock aria-hidden className="size-12 text-text-accent" />
          <h1 className="text-lg font-bold">Aguardando a confirmação do pagamento</h1>
          <p className="text-sm text-text-secondary">
            Seu pedido {order.id} foi enviado à {PROVIDER_LABELS[order.provider]}. Você pode recarregar ou sair desta página: ele continua e não será cobrado duas vezes.
          </p>
          {waitedLong && (
            <div className="flex flex-col items-center gap-2 text-sm">
              <p>Ainda estamos processando. Isso pode levar mais alguns instantes.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Atualizar</Button>
            </div>
          )}
        </div>
        <Items order={order} />
      </Card>
    )
  }

  if (order.status === 'refused') {
    return (
      <Card label="Pagamento recusado">
        <div role="alert" className="flex flex-col items-center gap-3 px-8 pb-4 pt-10 text-center">
          <XCircle aria-hidden className="size-12 text-destructive" />
          <h1 className="text-lg font-bold">Pagamento recusado</h1>
          <p className="text-sm text-text-secondary">{REASONS[order.refusalReason ?? 'payment_refused']} Seus itens continuam no carrinho e nada foi cobrado.</p>
          <div className="flex gap-3">
            <Link to="/pagamento" className={buttonVariants()}>Tentar novamente</Link>
            <Link to="/carrinho" className={buttonVariants({ variant: 'outline' })}>Voltar ao carrinho</Link>
          </div>
        </div>
        <Items order={order} />
      </Card>
    )
  }

  const receipt = order.receipt!
  return (
    <Card label="Recibo do pedido">
      <div className="flex flex-col items-center gap-3 border-b border-primary px-8 pb-5 pt-8 text-center">
        <CheckCircle2 aria-hidden className="size-14 text-text-accent" />
        <h1 className="text-sm text-text-secondary">Seus NFTs agora estão na sua carteira</h1>
      </div>
      <dl className="grid grid-cols-2 gap-4 border-b-2 border-primary px-8 py-4 text-xs md:grid-cols-4">
        <div><dt className="font-bold">ID da transação</dt><dd className="text-text-secondary">{shortRef(receipt.txRef)}</dd></div>
        <div><dt className="text-text-secondary">Data</dt><dd className="text-text-secondary">{day(receipt.confirmedAt)}</dd></div>
        <div><dt className="text-text-secondary">Total</dt><dd className="text-text-secondary">{formatEth(order.quote.total)}</dd></div>
        <div><dt className="font-bold">Carteira</dt><dd className="text-text-secondary">{PROVIDER_LABELS[order.provider]}</dd></div>
      </dl>
      <Items order={order} />
      <p className="px-8 pb-4 text-center text-[11px] text-text-secondary">
        Transação confirmada na {order.wallet.network === 'ethereum' ? 'Ethereum' : order.wallet.network === 'polygon' ? 'Polygon' : 'Solana'}. A propriedade foi transferida para sua carteira conectada e registrada na rede. A referência da transação é simulada.
      </p>
      <div className="flex justify-center pb-6">
        {/* Explorer links are simulated, so the control does not pretend to open anything. */}
        <Button disabled title="Link de exploração simulado" className="h-8 text-xs font-bold">Ver no Etherscan</Button>
      </div>
    </Card>
  )
}
