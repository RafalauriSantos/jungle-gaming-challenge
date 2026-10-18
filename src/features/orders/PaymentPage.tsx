import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { cartKeys } from '@/api/cart'
import { errorBodyOf } from '@/api/client'
import { connectWalletRequest, createOrderRequest, pendingOrdersOptions, type OrderBody } from '@/api/orders'
import type { Provider, Quote, QuoteChange, Wallet, WalletInput } from '@/api/types'
import { Button, buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCart, useQuote } from '@/features/cart/useCart'
import { useCoupon } from '@/features/cart/useCoupon'
import { NETWORK_LABELS } from '@/features/catalog/search'
import { EMPTY, PROVIDER_LABELS, type Values } from '@/features/wallets/WalletFields'
import { useWallets } from '@/features/wallets/useWallets'
import { formatEth } from '@/lib/domain/eth'
import { validateWallet } from '@/lib/domain/wallet-rules'
import { useMediaQuery } from '@/lib/ui/useMediaQuery'
import { useUser } from '@/session/store'
import { attemptKey } from './attempt'
import { clearDraft, loadDraft, saveDraft } from './checkoutDraft'
import { PaymentDesktop } from './PaymentDesktop'
import { PaymentMobile } from './PaymentMobile'
import type { PaymentModel } from './paymentModel'

function QuoteLines({ quote }: { quote: Quote }) {
  return (
    <ul className="flex flex-col gap-2">
      {quote.lines.map((l) => (
        <li key={l.lineId} className="flex items-center gap-3 rounded-md bg-surface-card p-2">
          <img src={l.image} alt="" width={40} height={48} className="h-12 w-10 rounded-sm object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{l.name}</p>
            <p className="text-xs text-text-secondary">ID do token: {l.tokenId} · Edição {l.tier}</p>
          </div>
          <span className="text-xs text-text-secondary">(x {l.quantity})</span>
          <span className="text-sm font-bold text-text-accent">{formatEth(l.lineTotal)}</span>
        </li>
      ))}
    </ul>
  )
}

function Totals({ quote }: { quote: Quote }) {
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-y-1.5 text-sm">
      <dt>Subtotal</dt><dd className="text-right">{formatEth(quote.subtotal)}</dd>
      <dt>Desconto do lançamento</dt><dd className="text-right">(-) {formatEth(quote.discount)}</dd>
      <dt>Taxa de rede</dt><dd className="text-right">{formatEth(quote.networkFee)}</dd>
      <dt className="border-t border-border pt-2 font-bold">Total</dt>
      <dd className="border-t border-border pt-2 text-right font-bold text-text-accent">{formatEth(quote.total)}</dd>
    </dl>
  )
}

/** Same lines, prices, coupon, fee and total: nothing for the user to look at again. */
const sameTerms = (a: Quote, b: Quote) =>
  a.total === b.total &&
  a.networkFee === b.networkFee &&
  a.discount === b.discount &&
  a.lines.length === b.lines.length &&
  a.lines.every((l, i) => l.lineId === b.lines[i]!.lineId && l.quantity === b.lines[i]!.quantity && l.unitPrice === b.lines[i]!.unitPrice)

export function PaymentPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const user = useUser()!
  const cart = useCart()
  const [coupon] = useCoupon()
  const quote = useQuote(cart.data?.version, coupon)
  const wallets = useWallets()

  const [draft] = useState(() => loadDraft(user.id))
  const [walletId, setWalletId] = useState(draft?.walletId)
  const desktop = useMediaQuery('(min-width: 768px)')
  const [otherChosen, setOther] = useState(draft?.other ?? false)
  // A one-off wallet is drawn only on desktop; on mobile the saved wallets are the choice.
  const other = otherChosen && desktop
  const [note, setNote] = useState(draft?.note ?? '')
  const [inline, setInline] = useState<Values>(draft?.inline ?? EMPTY)
  const [inlineErrors, setInlineErrors] = useState<Record<string, string>>({})
  const [noteError, setNoteError] = useState<string>()
  const [provider, setProvider] = useState<Provider | undefined>(draft?.provider)
  const [connection, setConnection] = useState<'idle' | 'connecting' | 'connected'>('idle')
  const [connectError, setConnectError] = useState<string>()
  const [problem, setProblem] = useState<string>()
  const [reviewing, setReviewing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [checking, setChecking] = useState(false)
  // The quote the user has seen and accepted. One with different terms must be confirmed again.
  const [accepted, setAccepted] = useState<Quote>()
  const [changes, setChanges] = useState<QuoteChange[]>([])
  const sending = useRef(false)
  // One order at a time: with one still pending, going to payment opens it instead of starting another.
  const pending = useQuery(pendingOrdersOptions(user.id))
  // Only an answer from this visit counts: a cached list may name an order that has since settled.
  const pendingId = pending.isFetchedAfterMount ? pending.data?.[0]?.id : undefined
  useEffect(() => {
    // While this page is the one sending an order, it finds the order itself; no redirect from the side.
    if (pendingId && !sending.current) void router.navigate({ to: '/pedido/$id', params: { id: pendingId }, replace: true })
  }, [pendingId, router])
  const q = quote.data
  const settled = !!q && !quote.isPlaceholderData

  useEffect(() => {
    if (!settled) return
    // Asking again for the same terms gives a new id but nothing to confirm.
    if (!accepted || sameTerms(accepted, q)) setAccepted(q)
  }, [settled, q, accepted])

  useEffect(() => {
    saveDraft(user.id, { walletId, other: otherChosen, inline, provider, note })
  }, [user.id, walletId, otherChosen, inline, provider, note])

  const saved = [wallets.data?.primary, wallets.data?.secondary].filter((w): w is Wallet => !!w)
  const compatible = saved.filter((w) => w.network === q?.network)
  const selectedId = walletId ?? compatible[0]?.id
  const selected = saved.find((w) => w.id === selectedId)
  const stale = !!q && !!accepted && !sameTerms(accepted, q)

  async function connect() {
    if (!provider || connection === 'connecting') return
    setConnection('connecting')
    setConnectError(undefined)
    try {
      await connectWalletRequest(provider)
      setConnection('connected')
    } catch (error) {
      setConnection('idle')
      setConnectError(errorBodyOf(error)?.message ?? 'Não foi possível conectar a carteira. Tente novamente.')
    }
  }

  function disconnect() {
    setConnection('idle')
    setProvider(undefined)
  }

  function review() {
    setProblem(undefined)
    if (!q || stale || q.issues.length) return
    if (!provider || connection !== 'connected') return setProblem('Conecte uma carteira (MetaMask, WalletConnect ou Coinbase Wallet) para continuar.')
    if (other) {
      const found = validateWallet(inline as unknown as Partial<WalletInput>)
      setInlineErrors(found)
      if (Object.keys(found).length) return
    } else if (!selected) {
      return setProblem(`Cadastre uma carteira da rede ${NETWORK_LABELS[q.network]} em Carteiras para continuar.`)
    }
    setReviewing(true)
  }

  async function confirm() {
    if (!q || !provider || sending.current) return // a second click while one is in flight does nothing
    if (stale || q.issues.length) return // the terms on screen are not the ones the user accepted
    const wallet: OrderBody['wallet'] = other ? { inline: Object.fromEntries(Object.entries(inline).filter(([, v]) => v)) as unknown as WalletInput } : { walletId: selectedId! }
    const body: OrderBody = { quoteId: q.id, wallet, provider, ...(note.trim() && { note: note.trim() }) }
    const key = attemptKey(localStorage, user.id, body)
    sending.current = true
    setSubmitting(true)
    setProblem(undefined)
    try {
      const order = await sendWithRecovery(key, body)
      clearDraft(user.id)
      await router.navigate({ to: '/pedido/$id', params: { id: order.id } })
    } catch (error) {
      const err = errorBodyOf(error)
      setReviewing(false)
      if (err?.code === 'order_pending') {
        await router.navigate({ to: '/pedido/$id', params: { id: (err.details as { orderId: string }).orderId } })
      } else if (err?.code === 'quote_stale') {
        const details = err.details as { quote?: Quote; changes: QuoteChange[] }
        setChanges(details.changes)
        if (details.quote && cart.data) queryClient.setQueryData(cartKeys.quote(user.id, cart.data.version, coupon), details.quote)
        else void queryClient.invalidateQueries({ queryKey: ['u', user.id, 'cart'] })
      } else if (err?.code === 'availability_conflict') {
        setProblem('Algum item não tem mais estoque suficiente. Revise o carrinho.')
        void queryClient.invalidateQueries({ queryKey: ['u', user.id, 'quote'] })
      } else if (err?.fields) {
        setNoteError(err.fields.note)
        setInlineErrors(Object.fromEntries(Object.entries(err.fields).map(([k, v]) => [k.replace(/^wallet\./, ''), v])))
        setProblem(err.fields.wallet ?? err.message)
      } else {
        setProblem(err?.message ?? 'Não foi possível enviar o pedido. Tente novamente: ele não será duplicado.')
      }
    } finally {
      sending.current = false
      setSubmitting(false)
      setChecking(false)
    }
  }

  /**
   * Sends the order. If no answer comes back (the request may or may not have created it), the same
   * key is sent again, which returns the order if it exists. A new attempt is never offered meanwhile.
   */
  async function sendWithRecovery(key: string, body: OrderBody) {
    for (let attempt = 1; ; attempt++) {
      try {
        return (await createOrderRequest(key, body)).order
      } catch (error) {
        if (errorBodyOf(error) || attempt >= 4) throw error // an answer, or too many silent tries
        setChecking(true)
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
      }
    }
  }

  if (cart.isError || quote.isError) {
    return (
      <main className="mx-auto flex max-w-[1232px] flex-col items-start gap-3 px-4 py-12">
        <p role="alert">Não foi possível carregar o pagamento.</p>
        <Button onClick={() => { void cart.refetch(); void quote.refetch() }}>Tentar novamente</Button>
      </main>
    )
  }
  if (cart.data && cart.data.items.length === 0) {
    return (
      <main className="mx-auto flex max-w-[1232px] flex-col items-start gap-3 px-4 py-12">
        <h1 className="text-xl font-bold">Pagamento</h1>
        <p>Seu carrinho está vazio.</p>
        <Link to="/" className={buttonVariants()}>Explorar NFTs</Link>
      </main>
    )
  }

  const model: PaymentModel = {
    quote: q,
    settled,
    stale,
    changes,
    acceptNewTerms: () => {
      setAccepted(q)
      setChanges([])
    },
    coupon,
    walletsLoading: wallets.isPending,
    saved,
    selectedId,
    selected,
    chooseWallet: setWalletId,
    other,
    setOther,
    inline,
    setInlineField: (key) => (value) => setInline((state) => ({ ...state, [key]: value })),
    inlineErrors,
    note,
    setNote,
    noteError,
    provider,
    chooseProvider: (next) => {
      setProvider(next)
      setConnection('idle') // a different wallet app has to connect on its own
      setConnectError(undefined)
    },
    connection,
    connect: () => void connect(),
    disconnect,
    connectError,
    problem,
    canReview: !!q && settled && !stale && !submitting && !q.issues.length,
    review,
  }

  return (
    <>
      {desktop ? <PaymentDesktop m={model} /> : <PaymentMobile m={model} />}
      <Dialog open={reviewing} onOpenChange={(open) => !submitting && setReviewing(open)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Revise seu pedido</DialogTitle>
            <DialogDescription>Confira os itens e os valores. Nada é cobrado antes de você confirmar.</DialogDescription>
          </DialogHeader>
          {q && (
            <>
              <QuoteLines quote={q} />
              <Totals quote={q} />
              <p className="text-sm text-text-secondary">
                {PROVIDER_LABELS[provider ?? 'metamask']} · Rede {NETWORK_LABELS[q.network]} · {other ? 'Carteira avulsa' : selected?.nickname}
              </p>
              {note.trim() && <p className="text-sm text-text-secondary">Observação: {note.trim()}</p>}
            </>
          )}
          {stale && (
            <div role="alert" className="flex flex-col items-start gap-2 rounded-md border border-primary p-3 text-sm">
              <p className="font-bold">Os valores mudaram enquanto você revisava. Confira o novo total acima e aceite para continuar.</p>
              <Button size="sm" onClick={model.acceptNewTerms}>Aceitar novos valores</Button>
            </div>
          )}
          {!!q?.issues.length && (
            <p role="alert" className="text-sm text-destructive">Um item não tem mais estoque suficiente. Volte e ajuste o carrinho.</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={submitting} onClick={() => setReviewing(false)}>Voltar</Button>
            <Button disabled={submitting || stale || !!q?.issues.length} onClick={() => void confirm()}>{submitting ? 'Enviando…' : 'Enviar pedido'}</Button>
          </div>
          <div aria-live="polite" className="min-h-5 text-sm">
            {checking && <p role="status">Verificando seu pedido… Não foi possível ler a resposta, mas o envio não será duplicado.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
