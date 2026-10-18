import { Link } from '@tanstack/react-router'
import { PROVIDERS } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { NETWORK_LABELS } from '@/features/catalog/search'
import { fromWallet, PROVIDER_LABELS, WalletFields } from '@/features/wallets/WalletFields'
import { formatEth } from '@/lib/domain/eth'
import { cn } from '@/lib/utils'
import { ConnectRow, Notices } from './PaymentParts'
import type { PaymentModel } from './paymentModel'

const NOTE_MAX = 280

function Items({ m }: { m: PaymentModel }) {
  const q = m.quote!
  return (
    <ul className="flex flex-col gap-3">
      {q.lines.map((l) => (
        <li key={l.lineId} className="flex h-[70px] items-center gap-2 bg-surface-card pl-1 pr-4">
          <img src={l.image} alt={`Arte do NFT ${l.name}`} width={70} height={70} className="size-[70px] shrink-0 rounded-lg object-cover" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 leading-4">
            <p className="break-words text-base font-bold">{l.name}</p>
            <p className="text-sm text-tone">ID do token: {l.tokenId}</p>
          </div>
          <span className="text-sm text-text-secondary">(x {l.quantity})</span>
          <span className="w-[88px] text-right text-lg font-bold text-text-accent">{formatEth(l.lineTotal)}</span>
        </li>
      ))}
    </ul>
  )
}

function Totals({ m }: { m: PaymentModel }) {
  const q = m.quote!
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm">
        {m.coupon ? (
          <>Código <strong>{m.coupon}</strong> aplicado.</>
        ) : (
          <>
            Tem um código promocional?{' '}
            <Link to="/carrinho" className="text-text-accent underline">Aplique aqui</Link>
          </>
        )}
      </p>
      <dl className="grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 text-[15px]">
        <dt>Subtotal</dt><dd className="text-right text-lg leading-4">{formatEth(q.subtotal)}</dd>
        <dt>Desconto do lançamento</dt><dd className="text-right">(-) {formatEth(q.discount)}</dd>
        <dt>Taxa de rede</dt><dd className="text-right text-lg leading-4">{formatEth(q.networkFee)}</dd>
      </dl>
      <p className="text-xs leading-4 text-text-accent">Taxa estimada</p>
      <dl className="grid w-full grid-cols-[1fr_auto] items-center gap-x-4 border-t border-border pt-3 font-bold">
        <dt className="text-base">Total</dt><dd className="text-right text-lg text-text-accent">{formatEth(q.total)}</dd>
      </dl>
    </div>
  )
}

function SavedWalletSelect({ m }: { m: PaymentModel }) {
  const network = m.quote?.network
  return (
    <Field className="max-w-[calc(50%-12px)] gap-0">
      <FieldLabel htmlFor="saved-wallet" className="h-[29px] gap-0 text-[15px] font-normal leading-[15px]">Carteira salva</FieldLabel>
      <Select value={m.selectedId ?? null} onValueChange={(v) => v && m.chooseWallet(v)}>
        <SelectTrigger id="saved-wallet" aria-label="Carteira salva" className="h-10 rounded-[3px] px-3 text-[14px]">
          <SelectValue placeholder="Selecione uma carteira">
            {(v: string) => {
              const w = m.saved.find((x) => x.id === v)
              return w ? `${w.nickname} · ${w.address.slice(0, 6)}…${w.address.slice(-4)}` : undefined
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {m.saved.map((w) => {
            const ok = w.network === network
            return (
              <SelectItem key={w.id} value={w.id} disabled={!ok}>
                {w.nickname} · Rede {NETWORK_LABELS[w.network]}{ok ? '' : ' — diferente da rede do carrinho'}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </Field>
  )
}

export function PaymentDesktop({ m }: { m: PaymentModel }) {
  const q = m.quote
  return (
    <main className="mx-auto max-w-[1232px] px-4 pb-10 pt-8">
      <nav aria-label="Você está em" className="text-[15px] font-bold leading-4">
        <Link to="/">Início</Link> / <span>Mercado</span> / <span aria-current="page">Pagamento</span>
      </nav>
      <h1 className="sr-only">Pagamento com carteira</h1>

      <div className="mt-8 flex items-start gap-8">
        <section aria-labelledby="collector" className="flex min-w-0 flex-1 flex-col gap-3">
          <h2 id="collector" className="text-[17px] font-bold leading-4">Perfil do colecionador</h2>
          <div className="flex flex-col gap-6">
            {m.walletsLoading ? (
              <Skeleton className="h-[330px] w-full" aria-label="Carregando carteiras" />
            ) : (
              <>
                {!m.other && m.saved.length > 0 && <SavedWalletSelect m={m} />}
                {!m.other && m.saved.length === 0 && (
                  <p className="text-sm text-text-secondary">
                    Você ainda não cadastrou uma carteira. <Link to="/carteiras" className="text-text-accent underline">Cadastrar carteira</Link>
                  </p>
                )}
                {m.other ? (
                  <fieldset className="flex flex-col gap-3">
                    <legend className="sr-only">Dados da carteira avulsa</legend>
                    <p className="text-xs text-text-secondary">Esta carteira vale só para este pedido; ela não é salva.</p>
                    <WalletFields idPrefix="inline" values={m.inline} errors={m.inlineErrors} set={m.setInlineField} />
                  </fieldset>
                ) : (
                  m.selected && (
                    <fieldset disabled aria-label="Dados da carteira salva">
                      <WalletFields idPrefix="saved" values={fromWallet(m.selected)} errors={{}} set={() => () => {}} readOnly />
                    </fieldset>
                  )
                )}
              </>
            )}

            <label className="flex w-fit items-center gap-2 text-[15px]">
              <Checkbox checked={m.other} onCheckedChange={(v) => m.setOther(v === true)} className="size-[15px] rounded-full border-primary" />
              Usar outra carteira?
            </label>

            <Field data-invalid={m.noteError ? true : undefined} className="w-[350px] gap-3">
              <FieldLabel htmlFor="collector-note" className="text-[15px] font-normal leading-[15px]">Observação do colecionador (opcional)</FieldLabel>
              <textarea
                id="collector-note"
                name="note"
                rows={6}
                maxLength={NOTE_MAX}
                value={m.note}
                onChange={(e) => m.setNote(e.target.value)}
                aria-invalid={m.noteError ? true : undefined}
                aria-describedby={m.noteError ? 'collector-note-error' : undefined}
                className="h-[152px] w-full resize-none rounded-[3px] border border-input bg-transparent p-3 text-[14px] outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-destructive"
              />
              {m.noteError && <FieldError id="collector-note-error">{m.noteError}</FieldError>}
            </Field>
          </div>
        </section>

        <aside aria-label="Resumo do pedido" className="flex w-[405px] shrink-0 flex-col gap-3">
          <h2 className="text-[17px] font-bold leading-4">Seus NFTs</h2>
          <div className="flex items-center justify-between border-b border-border pb-3 text-base leading-4">
            <span className="font-bold">NFTs</span>
            <span className="font-medium">Subtotal</span>
          </div>
          {!q ? (
            <div role="status" aria-busy="true" aria-label="Carregando resumo" className="flex flex-col gap-3">
              <Skeleton className="h-[70px] w-full" /><Skeleton className="h-[170px] w-full" />
            </div>
          ) : (
            <div aria-busy={!m.settled} className={cn('flex flex-col gap-3', !m.settled && 'opacity-60')}>
              <Items m={m} />
              <Totals m={m} />
            </div>
          )}

          <Notices m={m} />

          <fieldset className="mt-3 flex flex-col gap-5">
            <legend className="mb-5 w-full text-center text-[17px] font-bold leading-4">Carteira e rede</legend>
            <RadioGroup value={m.provider ?? ''} onValueChange={(v) => m.chooseProvider(v as (typeof PROVIDERS)[number])} disabled={m.connection !== 'idle'} aria-label="Carteira" className="gap-4">
              {PROVIDERS.map((p) => (
                <label key={p} className={cn('flex h-[45px] items-center gap-2.5 rounded-[3px] border border-input px-3 text-[15px]', m.provider === p && 'border-primary')}>
                  <RadioGroupItem value={p} className="size-4" />
                  {PROVIDER_LABELS[p]}
                </label>
              ))}
            </RadioGroup>
            <ConnectRow m={m} />
            <Button className="h-[45px] rounded-lg text-[15px] font-bold" disabled={!m.canReview} onClick={m.review}>
              Confirmar compra
            </Button>
          </fieldset>
        </aside>
      </div>
    </main>
  )
}
