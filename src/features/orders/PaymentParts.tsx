import { Link } from '@tanstack/react-router'
import type { QuoteChange } from '@/api/types'
import { Button } from '@/components/ui/button'
import { PROVIDER_LABELS } from '@/features/wallets/WalletFields'
import type { PaymentModel } from './paymentModel'

const describe = (c: QuoteChange) =>
  c.type === 'price_changed' ? 'Um preço mudou.' : c.type === 'unavailable' ? 'O estoque de um item diminuiu.' : c.type === 'coupon_changed' ? 'O cupom mudou.' : c.type === 'fee_changed' ? 'A taxa de rede mudou.' : 'O carrinho mudou.'

/** Everything that interrupts the purchase: changed terms, missing stock, a refused connection, a problem. */
export function Notices({ m }: { m: PaymentModel }) {
  const q = m.quote
  return (
    <>
      {m.stale && (
        <div role="alert" className="rounded-md border border-primary p-3 text-sm">
          <p className="mb-2 font-bold">A cotação mudou. Confirme o novo total antes de continuar.</p>
          <ul className="mb-2 list-disc pl-5 text-text-secondary">{(m.changes.length ? m.changes : [{ type: 'price_changed' as const }]).map((c, i) => <li key={i}>{describe(c)}</li>)}</ul>
          <Button size="sm" onClick={m.acceptNewTerms}>Confirmar nova cotação</Button>
        </div>
      )}
      {q?.issues.map((i) => (
        <p key={i.editionId} role="alert" className="text-sm text-destructive">Estoque insuficiente em um item: restam {i.available}. <Link to="/carrinho" className="underline">Ajustar carrinho</Link></p>
      ))}
      {m.connectError && <p role="alert" className="text-sm text-destructive">{m.connectError}</p>}
      <p role="alert" className="text-sm text-destructive">{m.problem}</p>
    </>
  )
}

/** The simulated connection of the wallet app: not drawn in the Figma, so it stays small and quiet. */
export function ConnectRow({ m }: { m: PaymentModel }) {
  return (
    <div aria-live="polite" className="flex flex-wrap items-center gap-3 text-sm">
      {m.connection === 'connected' ? (
        <>
          <p role="status" className="text-text-accent">Carteira conectada: {PROVIDER_LABELS[m.provider!]}.</p>
          <Button type="button" variant="outline" size="sm" onClick={m.disconnect}>Desconectar</Button>
        </>
      ) : (
        <Button type="button" variant="outline" size="sm" disabled={!m.provider || m.connection === 'connecting'} onClick={m.connect}>
          {m.connection === 'connecting' ? 'Conectando…' : 'Conectar carteira'}
        </Button>
      )}
    </div>
  )
}
