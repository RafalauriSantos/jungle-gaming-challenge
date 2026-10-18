import { Link, useRouter } from '@tanstack/react-router'
import { ChevronLeft, EllipsisVertical, Wallet as WalletIcon } from 'lucide-react'
import type { Provider } from '@/api/types'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { NETWORK_LABELS } from '@/features/catalog/search'
import { PROVIDER_LABELS } from '@/features/wallets/WalletFields'
import { formatEth } from '@/lib/domain/eth'
import { cn } from '@/lib/utils'
import { ConnectRow, Notices } from './PaymentParts'
import type { PaymentModel } from './paymentModel'

// The order the frame draws them in.
const PROVIDER_ORDER: Provider[] = ['walletconnect', 'metamask', 'coinbase']
const LETTER: Partial<Record<Provider, string>> = { walletconnect: 'W', metamask: 'M' }

export function PaymentMobile({ m }: { m: PaymentModel }) {
  const router = useRouter()
  const network = m.quote?.network
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-1rem)] max-w-[414px] flex-col justify-between gap-6 px-7 pb-8 pt-4">
      <div className="flex flex-col gap-4">
        <div className="flex h-11 items-center gap-6">
          <Button type="button" variant="outline" size="icon" aria-label="Voltar" onClick={() => router.history.back()} className="size-[35px] rounded-full border-border-soft bg-surface-card">
            <ChevronLeft aria-hidden className="size-4 text-text-accent" />
          </Button>
          <h1 className="text-xl font-bold leading-4">Pagamento com carteira</h1>
        </div>

        <div className="flex items-center justify-between font-bold leading-4">
          <h2 id="saved-wallets" className="text-base">Carteira conectada</h2>
          <Link to="/carteiras" className="text-sm text-text-accent">Trocar carteira</Link>
        </div>

        {m.walletsLoading ? (
          <Skeleton className="h-[93px] w-full rounded-[14px]" aria-label="Carregando carteiras" />
        ) : m.saved.length === 0 ? (
          <p className="text-sm text-text-secondary">
            Você ainda não cadastrou uma carteira. <Link to="/carteiras" className="text-text-accent underline">Cadastrar carteira</Link>
          </p>
        ) : (
          <RadioGroup value={m.selectedId ?? ''} onValueChange={(v) => m.chooseWallet(v as string)} aria-labelledby="saved-wallets" className="gap-5">
            {m.saved.map((w) => {
              const ok = w.network === network
              return (
                <div key={w.id} className={cn('relative min-h-[93px] rounded-[14px] bg-surface-card shadow-[0_20px_20px_rgba(10,6,4,0.45)]', !ok && 'opacity-60')}>
                  <label className="flex h-full min-h-[93px] cursor-pointer items-start gap-[19px] py-[15px] pl-[19px] pr-12">
                    <RadioGroupItem value={w.id} disabled={!ok} className="mt-6 size-4" />
                    <span className="flex min-w-0 flex-col text-sm leading-[22px] text-text-secondary">
                      <strong className="mb-0.5 text-base leading-4 text-foreground">{w.nickname}</strong>
                      <span>{w.address.slice(0, 6)}…{w.address.slice(-4)}</span>
                      <span>Rede {NETWORK_LABELS[w.network]}{ok ? '' : ' — diferente da rede do carrinho'}</span>
                    </span>
                  </label>
                  <Link to="/carteiras" aria-label={`Gerenciar a carteira ${w.nickname}`} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-text-accent">
                    <EllipsisVertical aria-hidden className="size-4" />
                  </Link>
                </div>
              )
            })}
          </RadioGroup>
        )}

        <h2 id="providers" className="mt-2 text-base font-bold leading-4">Carteira e rede</h2>
        <RadioGroup value={m.provider ?? ''} onValueChange={(v) => m.chooseProvider(v as Provider)} disabled={m.connection !== 'idle'} aria-labelledby="providers" className="gap-4">
          {PROVIDER_ORDER.map((p) => (
            <label key={p} className="flex h-[65px] cursor-pointer items-center gap-[11px] rounded-[15px] bg-surface-card pl-[14px] pr-[19px] text-sm shadow-[0_0_20px_rgba(10,6,4,0.45)]">
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-raised text-sm font-bold text-text-accent">
                {LETTER[p] ?? <WalletIcon className="size-[18px]" strokeWidth={1.5} />}
              </span>
              <span className="flex-1">{PROVIDER_LABELS[p]}</span>
              <RadioGroupItem value={p} className="size-4" />
            </label>
          ))}
        </RadioGroup>

        <ConnectRow m={m} />
        <Notices m={m} />

        {m.quote && (
          <div aria-busy={!m.settled} className={cn('flex items-center justify-end gap-7 font-bold leading-4', !m.settled && 'opacity-60')}>
            <span className="text-base">Total:</span>
            <span className="text-lg text-text-accent">{formatEth(m.quote.total)}</span>
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={!m.canReview}
        onClick={m.review}
        className="h-[60px] w-full rounded-[40px] bg-gradient-to-br from-primary from-[4%] to-primary/80 text-[15px] font-bold text-ink disabled:opacity-50"
      >
        Confirmar compra
      </button>
    </main>
  )
}
