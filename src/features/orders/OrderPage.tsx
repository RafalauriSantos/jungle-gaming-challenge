import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { Clock, X, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { orderOptions } from '@/api/orders'
import type { Order } from '@/api/types'
import thankYou from '@/assets/icons/thank-you.svg'
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
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
/** "29 Jul, 2026", as the frame writes it. */
const day = (iso: string) => {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`
}

const LINE = 'h-px bg-border'

function Card({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <main className="mx-auto grid min-h-[70dvh] max-w-[1232px] place-items-center px-4 py-10">
      <section aria-label={label} className="relative w-full max-w-[578px] overflow-hidden bg-surface-card">
        <Link to="/" aria-label="Fechar" className="absolute right-[14px] top-[15px] text-text-accent">
          <X aria-hidden className="size-4" />
        </Link>
        {children}
        <div aria-hidden className="h-[10px] bg-primary" />
      </section>
    </main>
  )
}

/** The lines, the fee and the total of the order, as the receipt keeps them. */
function Items({ order }: { order: Order }) {
  return (
    <div className="flex flex-col gap-3 px-11 pb-6 pt-5">
      <h2 className="text-[15px] font-bold leading-4">Detalhes da transação</h2>
      <div aria-hidden className="flex items-center justify-between text-base leading-4">
        <span className="font-bold">NFTs</span>
        <span className="flex gap-12"><span className="font-bold">Edições</span><span className="font-medium">Subtotal</span></span>
      </div>
      <div aria-hidden className={LINE} />
      <ul className="flex flex-col gap-3">
        {order.quote.lines.map((l) => (
          <li key={l.lineId} className="flex h-[70px] items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={l.image} alt={`Arte do NFT ${l.name}`} width={70} height={70} className="size-[70px] shrink-0 rounded-lg object-cover" />
              <div className="flex w-[154px] flex-col gap-1.5 leading-4">
                <p className="break-words text-base font-bold">{l.name}</p>
                <p className="text-sm text-tone">ID do token: {l.tokenId}</p>
              </div>
            </div>
            <div className="flex w-[194px] items-center justify-end gap-12 leading-4">
              <span className="text-sm text-text-secondary">(x {l.quantity})</span>
              <span className="whitespace-nowrap text-lg font-bold text-text-accent">{formatEth(l.lineTotal)}</span>
            </div>
          </li>
        ))}
      </ul>
      <dl className="ml-auto grid w-[321px] grid-cols-[1fr_auto] items-center gap-y-3">
        <dt className="text-[15px]">Taxa de rede</dt><dd className="text-right text-lg leading-4">{formatEth(order.quote.networkFee)}</dd>
        <dt className="text-base font-bold leading-4">Total</dt><dd className="text-right text-lg font-bold leading-4 text-text-accent">{formatEth(order.quote.total)}</dd>
      </dl>
      <div aria-hidden className={LINE} />
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
  const network = order.wallet.network === 'ethereum' ? 'Ethereum' : order.wallet.network === 'polygon' ? 'Polygon' : 'Solana'
  const meta: [string, string, boolean][] = [
    ['ID da transação', shortRef(receipt.txRef), true],
    ['Data', day(receipt.confirmedAt), false],
    ['Total', formatEth(order.quote.total), false],
    ['Carteira', PROVIDER_LABELS[order.provider], true],
  ]
  return (
    <Card label="Recibo do pedido">
      <div className="flex h-[156px] flex-col items-center justify-center gap-4">
        <img src={thankYou} alt="" aria-hidden className="size-20" />
        <h1 className="text-base font-bold leading-4 text-text-secondary">Seus NFTs agora estão na sua carteira</h1>
      </div>
      <div aria-hidden className="h-px bg-primary" />
      <dl className="flex h-[65px] items-center justify-between px-9 py-1 text-text-secondary">
        {meta.map(([label, value, bold], i) => (
          <div key={label} className="contents">
            {i > 0 && <span aria-hidden className="h-[31px] w-px bg-primary" />}
            <div className="flex flex-col">
              <dt className={bold ? 'text-sm font-bold leading-4' : 'text-sm leading-4'}>{label}</dt>
              <dd className="text-[15px]">{value}</dd>
            </div>
          </div>
        ))}
      </dl>
      <div aria-hidden className="h-px bg-primary" />
      <Items order={order} />
      <div className="flex flex-col items-center gap-6 px-11 pb-12">
        <p className="text-center text-sm leading-[22px] text-text-secondary">
          Transação confirmada na {network}. A propriedade foi transferida para sua carteira conectada e registrada na rede. A referência da transação é simulada.
        </p>
        {/* Explorer links are simulated, so the control does not pretend to open anything. */}
        <Button disabled title="Link de exploração simulado" className="h-auto rounded-[5px] p-4 text-base font-bold leading-4 disabled:opacity-60">Ver no Etherscan</Button>
      </div>
    </Card>
  )
}
